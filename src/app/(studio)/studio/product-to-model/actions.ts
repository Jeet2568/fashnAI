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

/**
 * Submit a Product to Model job (Supports Batch)
 */
export async function runMakeItMore(
    state: any,
    formData: FormData
) {
    try {
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

        const modelPath = formData.get("model") as string;
        const garmentPath = formData.get("garment") as string;
        const backgroundPath = formData.get("background") as string;
        const promptsJson = formData.get("prompts") as string;

        // Parse options
        const options = {
            category: formData.get("category") as string || "tops",
            garment_photo_type: formData.get("garment_photo_type") as string || "auto",
            seed: formData.get("seed") as string,
            quality: formData.get("quality") as string,
            aspect_ratio: formData.get("aspect_ratio") as string || "3:4",
            num_samples: formData.get("num_samples") ? Number(formData.get("num_samples")) : 1
        };

        // Validate Paths
        if (!garmentPath) throw new Error("Garment image is required");

        const absGarmentPath = resolvePath(garmentPath);
        const absBackgroundPath = backgroundPath ? resolvePath(backgroundPath) : undefined;
        const absModelPath = modelPath ? resolvePath(modelPath) : undefined;

        // 1. Prepare Images
        const garmentImage = await fileToBase64(absGarmentPath);
        const backgroundImage = absBackgroundPath ? await fileToBase64(absBackgroundPath) : undefined;

        // 2. Parse Prompts (Batch Mode)
        let prompts: string[] = [];
        try {
            prompts = JSON.parse(promptsJson || "[]");
        } catch (e) {
            // Fallback for legacy single prompt
            prompts = [formData.get("prompt") as string || "high quality, realistic"];
        }
        if (prompts.length === 0) prompts = ["high quality, realistic"];

        console.log(`Starting Batch Generation with ${prompts.length} prompts...`);

        // 3. Execute Requests in Parallel
        const results = await Promise.all(prompts.map(async (prompt, index) => {
            let initialResponse;
            const seed = options.seed ? Number(options.seed) + index : undefined; // Shift seed for variation

            if (modelPath) {
                // Case A: TRY-ON (Model + Garment)
                const modelImage = await fileToBase64(absModelPath!);
                initialResponse = await fashnClient.runTryOn({
                    model_image: modelImage,
                    garment_image: garmentImage,
                    category: options.category as any,
                    cover_feet: false,
                    adjust_hands: false,
                    restore_background: false,
                    restore_clothes: false,
                    garment_photo_type: options.garment_photo_type as any,
                    seed,
                    quality: options.quality as any,
                    // num_inference_steps removed (not in interface)
                    guidance_scale: 2.5,
                    nsfw_filter: true,
                    return_base64: false
                });
            } else {
                // Case B: PRODUCT-TO-MODEL (Garment only)
                initialResponse = await fashnClient.runProductToModel({
                    product_image: garmentImage,
                    prompt: prompt,
                    aspect_ratio: options.aspect_ratio as any,
                    num_images: 1, // Always 1 per slot
                    seed,
                    background_reference: backgroundImage,
                    hd: (options.quality === "balanced" || options.quality === "creative") ? true : undefined,
                    // adjust_hands, restore_clothes, restore_background, garment_photo_type are NOT supported in Product To Model
                });
            }
            if (initialResponse.error) {
                throw new Error(initialResponse.error || "API Error");
            }
            return { id: initialResponse.id, prompt };
        }));

        // 4. Poll & Save
        const refPath = modelPath || garmentPath;
        const refDir = path.dirname(refPath); // Relative path from DB

        // Resolve Save Path
        // If refDir is inside "RAW", go up and to "Results"
        // Since we are running on server, we need ABSOLUTE path to save.
        // We can use absGarmentPath or absModelPath to find the directory.

        const sourceFileAbs = absModelPath || absGarmentPath;
        const resultsDir = determineResultsDir(sourceFileAbs);

        await fs.mkdir(resultsDir, { recursive: true });

        const allSavedPaths: string[] = [];

        const completedJobs: { job: any, outputUrls: string[] }[] = [];

        // 4. Poll (Parallel)
        await Promise.all(results.map(async (job) => {
            let status = "starting";
            let outputUrls: string[] = [];

            // Poll
            for (let i = 0; i < MAX_POLLS; i++) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL));
                try {
                    const poll = await fashnClient.getStatus(job.id);
                    status = poll.status;
                    if (status === "completed") {
                        outputUrls = poll.output || [];
                        completedJobs.push({ job, outputUrls });
                        break;
                    }
                    if (status === "failed" || status === "canceled") throw new Error(poll.error || "Failed");
                } catch (e) {
                    console.error(`Polling error job ${job.id}:`, e);
                }
            }
        }));

        // 5. Save (Sequential to ensure unique naming)
        for (const { job, outputUrls } of completedJobs) {
            if (outputUrls.length > 0) {
                for (const url of outputUrls) {
                    try {
                        const buffer = await downloadImage(url);
                        // Naming: OriginalName[_N].ext in Results folder
                        const baseName = path.basename(sourceFileAbs, path.extname(sourceFileAbs));
                        const savePath = await getUniqueFilename(resultsDir, baseName, ".png");

                        await fs.writeFile(savePath, Buffer.from(buffer));
                        allSavedPaths.push(savePath);
                    } catch (e) {
                        console.error("Failed to save image", e);
                    }
                }
            }
        }

        // 6. Log Global Job (Optional, just logging the batch)
        try {
            const user = await getCurrentUser();
            if (user) {
                await prisma.job.create({
                    data: {
                        userId: user.id,
                        status: "COMPLETED",
                        inputParams: JSON.stringify({ prompts, options }),
                        outputPaths: JSON.stringify(allSavedPaths),
                    }
                });
            }
        } catch (e) {
            console.warn("Failed to log job to DB", e);
        }

        return { success: true, paths: allSavedPaths };

    } catch (error: any) {
        console.error("Batch Job Failed:", error);
        return { success: false, error: error.message };
    }
}

async function downloadImage(url: string): Promise<ArrayBuffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
    return res.arrayBuffer();
}
