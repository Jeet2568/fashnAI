import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { fashnClient } from "@/lib/fashn/client";
import { fileToBase64, getUniqueFilename, determineResultsDir } from "@/lib/server-utils";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sourceImage, faceReference, prompt } = z.object({
            sourceImage: z.string(),
            faceReference: z.string().nullable().optional(),
            prompt: z.string().optional(),
        }).parse(body);

        // 1. Verify Original File Exists
        try {
            await fs.access(sourceImage);
        } catch {
            return NextResponse.json({ error: "Source file not found" }, { status: 404 });
        }

        // 2. Determine Output Path
        const filename = path.basename(sourceImage, path.extname(sourceImage));
        const resultsDir = determineResultsDir(sourceImage);

        const outputPath = await getUniqueFilename(resultsDir, filename, ".png");

        // 3. Prepare Inputs
        const sourceBase64 = await fileToBase64(sourceImage);
        let faceBase64 = undefined;
        if (faceReference) {
            faceBase64 = await fileToBase64(faceReference);
        }

        // 4. Call Fashn.ai API
        console.log("Starting Model Swap...");
        const initialResponse = await fashnClient.runModelSwap({
            model_image: sourceBase64,
            prompt: prompt || "Swap model, preserve clothing",
            face_reference: faceBase64,
            face_reference_mode: faceBase64 ? "match_reference" : undefined,
            return_base64: false, // Use URL for polling efficiency
            output_format: "png"
        });

        // POLL for completion
        let jobId = initialResponse.id;
        let status = initialResponse.status;
        let outputUrl = "";

        if (status === "completed" && initialResponse.output?.length) {
            outputUrl = initialResponse.output[0];
        } else {
            // Poll
            const MAX_POLLS = 60;
            for (let i = 0; i < MAX_POLLS; i++) {
                if (status === "completed" || status === "failed") break;
                await new Promise(r => setTimeout(r, 2000));
                const poll = await fashnClient.getStatus(jobId);
                status = poll.status;
                if (status === "completed") outputUrl = poll.output?.[0] || "";
                if (status === "failed") throw new Error(poll.error || "Job failed");
            }
        }

        if (!outputUrl) throw new Error("Job timed out or returned no output");

        // 5. Save Result (Download from URL)
        const imageRes = await fetch(outputUrl);
        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(outputPath, buffer);

        // 6. Record Job in DB
        const user = await getCurrentUser();
        await prisma.job.create({
            data: {
                userId: user.id,
                status: "COMPLETED",
                inputParams: JSON.stringify({
                    type: "model-swap",
                    prompt,
                    source: sourceImage,
                    faceReference: faceReference || "none"
                }),
                outputPaths: JSON.stringify([outputPath]),
            }
        });

        return NextResponse.json({
            success: true,
            path: outputPath,
            filename: path.basename(outputPath)
        });

    } catch (error: any) {
        console.error("Model Swap API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process swap" }, { status: 500 });
    }
}
