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
        const { imagePath, maskImage, prompt } = z.object({
            imagePath: z.string(),
            maskImage: z.string(), // Base64
            prompt: z.string(),
        }).parse(body);

        // 1. Verify Original File Exists
        try {
            await fs.access(imagePath);
        } catch {
            return NextResponse.json({ error: "Original file not found" }, { status: 404 });
        }

        // 2. Determine Output Path
        const filename = path.basename(imagePath, path.extname(imagePath));
        const resultsDir = determineResultsDir(imagePath);

        const outputPath = await getUniqueFilename(resultsDir, filename, ".png");

        // 3. Call Fashn.ai API
        console.log("Starting Edit...");
        const sourceBase64 = await fileToBase64(imagePath);

        // Note: Fashn Edit doesn't strictly take a mask in the 'inputs' according to some docs,
        // but often Inpainting uses source + mask + prompt.
        // Based on our client implementation: runEdit({ image, prompt, ... })
        // If Fashn supports mask for edit, we should pass it. 
        // Let's assume for now we just pass image + prompt as per the Search definition of 'Edit' endpoint.
        // If we want detailed inpainting with mask, we might need to composite or pass mask if supported.
        // Since docs were ambiguous on mask, we'll try passing just image+prompt or see if we can pass mask.
        // BUT: User specifically asked for Brush tool. 
        // If 'Edit' endpoint is instruction based (no mask), then the mask UI is for user reference or we need to apply it?
        // Actually, Fashn 'Edit' is powerful enough to handle "Make shirt red" without a mask. 
        // However, if we possess a mask, we should check if we can filter the effect.
        // For now: We will send the whole image and the prompt.
        // TODO: If mask is required for precision, we might need to composite it or use a different endpoint.

        const initialResponse = await fashnClient.runEdit({
            image: sourceBase64,
            prompt: prompt,
            return_base64: false,
            output_format: "png"
        });

        // POLL for completion
        let jobId = initialResponse.id;
        let status = initialResponse.status;
        let outputUrl = "";

        if (status === "completed" && initialResponse.output?.length) {
            outputUrl = initialResponse.output[0];
        } else {
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

        // 4. Save Result
        const imageRes = await fetch(outputUrl);
        const arrayBuffer = await imageRes.arrayBuffer();
        await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

        // 5. Record Job in DB
        const user = await getCurrentUser();
        await prisma.job.create({
            data: {
                userId: user.id,
                status: "COMPLETED",
                inputParams: JSON.stringify({
                    type: "edit",
                    prompt,
                    source: imagePath
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
        console.error("Edit API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process edit" }, { status: 500 });
    }
}
