"use server";

import { fashnClient, RunInput } from "@/lib/fashn/client";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import fs from "fs/promises";
import path from "path";
import { fileToBase64 } from "@/lib/server-utils";

const MAX_POLLS = 60; // 2 minutes approx
const POLL_INTERVAL = 2000;

export async function runMakeItMore(
    modelPath: string | null | undefined,
    garmentPath: string,
    category: "tops" | "bottoms" | "one-pieces",
    options: Partial<RunInput>,
    backgroundPath?: string | null
) {
    try {
        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");
        const resolvePath = (p: string) => {
            if (path.isAbsolute(p)) return p;
            return path.join(nasRoot, p);
        };

        const absGarmentPath = resolvePath(garmentPath);
        const absBackgroundPath = backgroundPath ? resolvePath(backgroundPath) : undefined;
        const absModelPath = modelPath ? resolvePath(modelPath) : undefined;

        // 1. Prepare Images
        const garmentImage = await fileToBase64(absGarmentPath);
        const backgroundImage = absBackgroundPath ? await fileToBase64(absBackgroundPath) : undefined;

        let initialResponse;
        let jobType = "product-to-model";

        // 0. Resolve Quality Settings
        let qualityParams = {};
        if (options.quality === "balanced") {
            qualityParams = { num_inference_steps: 30, guidance_scale: 2.5 };
        } else if (options.quality === "creative") {
            qualityParams = { num_inference_steps: 50, guidance_scale: 5.0 };
        }
        // Default (Precise) uses standard defaults

        if (modelPath) {
            // Case A: TRY-ON (Model + Garment)
            const modelImage = await fileToBase64(modelPath);
            console.log("Starting Try-On...");
            jobType = "try-on";
            initialResponse = await fashnClient.runTryOn({
                model_image: modelImage,
                garment_image: garmentImage,
                category,
                ...options,
                return_base64: false
            });
        } else {
            // Case B: PRODUCT-TO-MODEL (Garment only)
            console.log("Starting Product-to-Model...");
            jobType = "product-to-model";
            initialResponse = await fashnClient.runProductToModel({
                product_image: garmentImage,
                prompt: options.prompt,
                aspect_ratio: options.aspect_ratio || "3:4",
                num_images: options.num_samples || 1,
                return_base64: false,
                seed: options.seed ? Number(options.seed) : undefined,
                background_reference: backgroundImage
            });
        }

        console.log("Initial API Response:", JSON.stringify(initialResponse, null, 2));

        let jobId = initialResponse.id;
        let status = initialResponse.status || "starting";
        let outputUrls: string[] = initialResponse.output || [];
        let error = initialResponse.error;

        // 3. Poll for Completion
        // If we don't have a final status yet, poll.
        if (status !== "completed" && status !== "failed" && status !== "canceled") {
            for (let i = 0; i < MAX_POLLS; i++) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL));
                try {
                    const poll = await fashnClient.getStatus(jobId);
                    console.log(`Poll ${i + 1}/${MAX_POLLS}:`, poll.status, poll.error ? `Error: ${poll.error}` : "");
                    status = poll.status;
                    if (status === "completed") {
                        outputUrls = poll.output || [];
                        console.log("Job Completed. Output:", outputUrls);
                        break;
                    }
                    if (status === "failed" || status === "canceled") {
                        error = poll.error || "Job failed or canceled";
                        console.error("Job Failed:", error);
                        break;
                    }
                } catch (e: any) {
                    console.error("Polling error:", e.message);
                }
            }
        } else if (status === "completed") {
            outputUrls = initialResponse.output || [];
        }

        if (status !== "completed" || !outputUrls.length) {
            console.error("Final Error State:", { status, outputUrls, error });
            throw new Error(error || "Generation timed out or failed");
        }

        // 4. Download and Save Result
        // 4. Download and Save Result
        // Determine Save Path
        const refPath = modelPath || garmentPath;
        const modelDir = path.dirname(refPath);
        let resultsDir = "";
        if (modelDir.endsWith("RAW") || modelDir.endsWith("RAW\\") || modelDir.endsWith("RAW/")) {
            resultsDir = path.join(path.dirname(modelDir), "Results");
        } else {
            resultsDir = path.join(modelDir, "Results");
        }

        // Ensure directory exists
        try {
            await fs.mkdir(resultsDir, { recursive: true });
        } catch (e) {
            // If creation fails, fallback to model dir
            resultsDir = modelDir;
        }

        const timestamp = new Date().getTime();
        const savedPaths: string[] = [];

        await Promise.all(outputUrls.map(async (url, index) => {
            const filename = `${path.basename(refPath, path.extname(refPath))}_tryon_${timestamp}_${index + 1}.jpg`;
            const outputPath = path.join(resultsDir, filename);

            const imageRes = await fetch(url);
            if (!imageRes.ok) throw new Error("Failed to download result image");
            const arrayBuffer = await imageRes.arrayBuffer();
            await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
            savedPaths.push(outputPath);
        }));

        // 5. Log Job to DB
        const user = await getCurrentUser();
        await prisma.job.create({
            data: {
                userId: user.id,
                status: "COMPLETED",
                inputParams: JSON.stringify({
                    type: "try-on",
                    category,
                    model: modelPath || "product-to-model",
                    garment: garmentPath,
                    ...options
                }),
                outputPaths: JSON.stringify(savedPaths),
            }
        });

        return { success: true, path: savedPaths[0], paths: savedPaths };

    } catch (error: any) {
        console.error("Try-On Error:", error);
        return { success: false, error: error.message };
    }
}
