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
        const resolvePath = (p: string) => path.isAbsolute(p) ? p : path.join(nasRoot, p);

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

            // Construct Mega Prompt
            const promptParts = [];
            // "A {gender} wearing {garmentType}" is sometimes redundant if Fashn AI prefers pure scene description for backgrounds,
            // but product-to-model allows full description.
            if (global.gender) promptParts.push(`A ${global.gender}`);
            if (global.garmentType) promptParts.push(`wearing ${global.garmentType}`);
            if (config.posePrompt) promptParts.push(config.posePrompt);
            if (config.anglePrompt) promptParts.push(config.anglePrompt);
            if (config.accessoriesPrompt) promptParts.push(`Accessories: ${config.accessoriesPrompt}`);

            if (global.bgType === "prompt" && global.bgPrompt) {
                promptParts.push(`Background setting: ${global.bgPrompt}`);
            }

            const finalPrompt = promptParts.join(". ");

            // Product-to-Model API is the most flexible for mixed parameters
            try {
                const initialResponse = await fashnClient.runProductToModel({
                    product_image: garmentBase64,
                    model_image: modelBase64,
                    prompt: finalPrompt || "Fashion portrait",
                    aspect_ratio: global.ratio as any || "3:4",
                    background_reference: bgBase64,
                    num_images: 1, // 1 per slot
                    garment_photo_type: config.garmentMode === "auto" ? "auto" : undefined,
                });

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
                    allSavedPaths.push(savePath);
                    finalResults.push({ configId: job.configId, savedPath: savePath });
                } catch (e: any) {
                    finalResults.push({ configId: job.configId, error: e.message });
                }
            }
        }

        // 5. Log Job in DB
        try {
            const user = await getCurrentUser();
            if (user && allSavedPaths.length > 0) {
                console.log("Saving job to DB...");
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
