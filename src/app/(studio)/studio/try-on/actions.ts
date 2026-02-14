"use server";

import { fashnClient, RunInput } from "@/lib/fashn/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { fileToBase64 } from "@/lib/server-utils";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

export async function runTryOnAction(
    modelPath: string,
    garmentPath: string,
    category: "tops" | "bottoms" | "one-pieces",
    options: Partial<RunInput>
) {
    try {
        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");

        // Helper to resolve paths
        const resolvePath = (p: string) => {
            if (path.isAbsolute(p)) return p;
            return path.join(nasRoot, p);
        };

        const absModelPath = resolvePath(modelPath);
        const absGarmentPath = resolvePath(garmentPath);

        const modelImage = await fileToBase64(absModelPath);
        const garmentImage = await fileToBase64(absGarmentPath);

        // Call API
        // NOTE: runTryOn maps to 'product-to-model' endpoint due to swap
        // v1.6 is strict: No prompt, aspect_ratio, quality, or deprecated fields.
        const payload: any = {
            model_image: modelImage,
            garment_image: garmentImage,
            category,
            return_base64: false
        };

        if (options.num_samples) payload.num_samples = options.num_samples;
        if (options.seed) payload.seed = options.seed;
        if (options.garment_photo_type) payload.garment_photo_type = options.garment_photo_type;
        if (options.long_top) payload.long_top = options.long_top;

        const response = await fashnClient.runTryOn(payload);

        const jobId = response.id;
        let status = response.status;
        let outputUrls: string[] = [];

        // Poll for completion
        for (let i = 0; i < 60; i++) {
            if (status === "completed" || status === "failed") break;
            await new Promise(r => setTimeout(r, 2000));
            const poll = await fashnClient.getStatus(jobId);
            status = poll.status;
            if (status === "completed") outputUrls = poll.output || [];
            if (status === "failed") throw new Error(poll.error || "Generation failed");
        }

        if (!outputUrls.length) throw new Error("No output generated");

        // Save Result
        const resultsDir = path.join(path.dirname(absModelPath), "Results");
        await fs.mkdir(resultsDir, { recursive: true });

        const timestamp = Date.now();
        const filename = `tryon_${timestamp}.jpg`;
        const outputPath = path.join(resultsDir, filename);

        const imgRes = await fetch(outputUrls[0]);
        const arrayBuffer = await imgRes.arrayBuffer();
        await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

        // Log to DB
        const user = await getCurrentUser();
        await prisma.job.create({
            data: {
                userId: user.id,
                status: "COMPLETED",
                inputParams: JSON.stringify({ type: "try-on", model: modelPath, garment: garmentPath, ...options }),
                outputPaths: JSON.stringify([outputPath])
            }
        });

        return { success: true, path: outputPath, url: outputUrls[0] };

    } catch (error: any) {
        console.error("Try-On Action Error:", error);
        return { success: false, error: error.message };
    }
}
