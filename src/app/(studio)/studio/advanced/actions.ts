"use server";

import { fashnClient } from "@/lib/fashn/client";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import fs from "fs/promises";
import path from "path";
import { fileToBase64, getUniqueFilename, determineResultsDir } from "@/lib/server-utils";

const MAX_POLLS = 60; // 2 minutes approx
const POLL_INTERVAL = 2000;

export async function runAdvancedBatch(payloadJson: string) {
    try {
        const payload = JSON.parse(payloadJson);
        const { configs, global } = payload;

        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");
        const resolvePath = (p: string) => {
            if (p.startsWith("/api/filesystem/image")) {
                const clean = p.split("?path=")[1]?.split("&")[0] || "";
                const decoded = decodeURIComponent(clean);
                return path.isAbsolute(decoded) ? decoded : path.join(nasRoot, decoded);
            }
            if (p.startsWith("/uploads/")) {
                return path.join(process.cwd(), "public", p);
            }
            return path.isAbsolute(p) ? p : path.join(nasRoot, p);
        };

        // 1. Prepare global background
        let bgBase64: string | undefined;
        if (global.bgType === "select" || global.bgType === "upload") {
            if (global.bgPath) {
                const absBgPath = resolvePath(global.bgPath);
                bgBase64 = await fileToBase64(absBgPath);
            }
        }

        console.log(`Starting Advanced Batch with ${configs.length} items...`);

        // 2. Fire requests in parallel
        const jobs = await Promise.all(configs.map(async (config: any, index: number) => {
            if (!config.photoPath) return { error: "Missing photo", configId: config.id };

            const absGarmentPath = resolvePath(config.photoPath);
            let garmentBase64;
            try {
                garmentBase64 = await fileToBase64(absGarmentPath);
            } catch (e) {
                return { error: `Garment file not found: ${absGarmentPath}`, configId: config.id };
            }

            let modelBase64;
            if (config.modelPath) {
                try {
                    modelBase64 = await fileToBase64(resolvePath(config.modelPath));
                } catch (e) {
                    console.error("Model image base64 conversion failed", e);
                }
            }

            // Construct prompt following official Fashn prompting guide:
            // 1. Shot summary (model description)
            // 2. Accessories / styling (important — placed early for visibility)
            // 3. Pose and framing
            // 4. Background and setting
            // NOTE: Do NOT describe the product/garment — the API reads it from the product_image
            const genderWord = global.gender === "male" ? "man" : "woman";
            const promptParts: string[] = [];

            // Shot summary
            promptParts.push(`Full body photo of a young adult ${genderWord}`);

            // Accessories — placed early so the model pays attention to them
            if (config.accessoriesPrompt) {
                promptParts.push(`wearing ${config.accessoriesPrompt}`);
            }

            // Pose
            if (config.posePrompt) promptParts.push(config.posePrompt);

            // Angle / framing
            if (config.anglePrompt) promptParts.push(config.anglePrompt);

            // Background
            if (global.bgType === "prompt" && global.bgPrompt) {
                promptParts.push(global.bgPrompt);
            }

            // Custom prompt — user-typed add-on instructions
            if (global.customPrompt) {
                promptParts.push(global.customPrompt);
            }

            const finalPrompt = promptParts.join(", ");

            // Stagger start to avoid hitting 524 timeouts from instant API concurrency
            if (index > 0) {
                await new Promise(r => setTimeout(r, index * 1000));
            }

            // Product-to-Model API — official schema
            try {
                const apiPayload: import("@/lib/fashn/client").ProductToModelInput = {
                    product_image: garmentBase64,
                    model_image: modelBase64,
                    prompt: finalPrompt || "studio portrait",
                    aspect_ratio: global.ratio as any || "3:4",
                    resolution: global.resolution as any || "1k",
                    background_reference: modelBase64 ? undefined : bgBase64,
                    output_format: "png",
                    num_images: 1,
                };

                console.log(`[AdvGen] Slot ${config.id} — Payload:`, {
                    prompt: apiPayload.prompt,
                    resolution: apiPayload.resolution,
                    aspect_ratio: apiPayload.aspect_ratio,
                    output_format: apiPayload.output_format,
                    has_product_image: !!apiPayload.product_image,
                    product_image_length: apiPayload.product_image?.length,
                    has_model_image: !!apiPayload.model_image,
                    has_background_reference: !!apiPayload.background_reference,
                });

                const initialResponse = await fashnClient.runProductToModel(apiPayload);

                if (initialResponse.error) {
                    return { error: initialResponse.error, configId: config.id };
                }

                return {
                    jobId: initialResponse.id,
                    configId: config.id,
                    originalPath: absGarmentPath,
                    finalPrompt
                };
            } catch (e: any) {
                return { error: e.message, configId: config.id };
            }
        }));

        const completedJobs: any[] = [];
        const failedJobs: any[] = [];

        // Distinguish successes from early failures
        for (const job of jobs) {
            if (job.error) failedJobs.push(job);
        }
        const activeJobs = jobs.filter(j => !j.error);

        // 3. Poll in parallel
        await Promise.all(activeJobs.map(async (job) => {
            let status = "starting";
            let outputUrls: string[] = [];

            for (let i = 0; i < MAX_POLLS; i++) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL));
                try {
                    const poll = await fashnClient.getStatus(job.jobId);
                    status = poll.status;
                    if (status === "completed") {
                        outputUrls = poll.output || [];
                        completedJobs.push({ ...job, outputUrls });
                        break;
                    }
                    if (status === "failed" || status === "canceled") {
                        failedJobs.push({ ...job, error: poll.error || "Job failed" });
                        break;
                    }
                } catch (e: any) {
                    console.error(`Polling error job ${job.jobId}:`, e);
                }
            }
        }));

        // 4. Save results (Sequential)
        const finalResults: { configId: string, savedPath?: string, error?: string }[] = [];
        const allSavedPaths: string[] = [];

        for (const job of failedJobs) {
            finalResults.push({ configId: job.configId, error: job.error });
        }

        for (const job of completedJobs) {
            if (job.outputUrls.length > 0) {
                try {
                    const url = job.outputUrls[0];
                    const res = await fetch(url);
                    if (!res.ok) throw new Error("Failed to download result");
                    const arrayBuffer = await res.arrayBuffer();

                    const resultsDir = determineResultsDir(job.originalPath);
                    await fs.mkdir(resultsDir, { recursive: true });

                    const baseName = path.basename(job.originalPath, path.extname(job.originalPath));
                    const savePath = await getUniqueFilename(resultsDir, baseName, ".png");

                    await fs.writeFile(savePath, Buffer.from(arrayBuffer));
                    const relPath = path.relative(nasRoot, savePath).replace(/\\/g, '/');
                    allSavedPaths.push(relPath);
                    finalResults.push({ configId: job.configId, savedPath: relPath });
                } catch (e: any) {
                    finalResults.push({ configId: job.configId, error: e.message });
                }
            }
        }

        // 5. Log Job in DB + deduct credits
        try {
            const user = await getCurrentUser();
            if (user) {
                const totalImages = allSavedPaths.length;
                const totalFailed = failedJobs.length;

                await prisma.job.create({
                    data: {
                        userId: user.id,
                        status: totalImages > 0 ? "COMPLETED" : "FAILED",
                        inputParams: JSON.stringify({
                            type: "advanced-batch",
                            configs: configs.length,
                        }),
                        outputPaths: JSON.stringify(allSavedPaths),
                        error: totalFailed > 0 ? `${totalFailed} items failed` : null,
                    }
                });

                // Deduct credits (1 per successfully saved image)
                if (totalImages > 0) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { credits: { decrement: totalImages } }
                    });
                    await prisma.creditLog.create({
                        data: {
                            userId: user.id,
                            amount: -totalImages,
                            reason: `Advanced batch: ${totalImages} image(s) generated`
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Failed to log job to DB", e);
        }

        return { success: true, results: finalResults };

    } catch (error: any) {
        console.error("Advanced Batch Failed:", error);
        return { success: false, error: error.message };
    }
}
