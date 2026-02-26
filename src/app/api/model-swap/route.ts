import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { fashnClient } from "@/lib/fashn/client";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";
import { fileToBase64, getUniqueFilename, determineResultsDir } from "@/lib/server-utils";

export async function POST(req: Request) {
    let dbJobId: string | null = null;
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { sourceImage, faceReference, prompt } = z.object({
            sourceImage: z.string(),
            faceReference: z.string().nullable().optional(),
            prompt: z.string().optional(),
        }).parse(body);

        const dbJob = await prisma.job.create({
            data: {
                userId: user.id,
                status: "PROCESSING",
                inputParams: JSON.stringify({
                    type: "model-swap",
                    prompt,
                    source: sourceImage,
                    faceReference: faceReference || "none"
                }),
            }
        });
        dbJobId = dbJob.id;

        // 1. Resolve Global Paths
        const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");

        const resolvePath = (p: string) => {
            if (p.startsWith("/api/filesystem/image")) {
                const clean = p.split("?path=")[1]?.split("&")[0] || "";
                p = decodeURIComponent(clean);
            }
            return path.isAbsolute(p) ? p : path.join(basePath, p);
        };

        const fullSourcePath = resolvePath(sourceImage);

        // 2. Verify Original File Exists
        try {
            await fs.access(fullSourcePath);
        } catch {
            console.error(`Model Swap API: Source file not found at ${fullSourcePath}`);
            return NextResponse.json({ error: "Source file not found" }, { status: 404 });
        }

        // 3. Determine Output Path
        const filename = path.basename(sourceImage, path.extname(sourceImage));
        const resolvedResultsDir = determineResultsDir(fullSourcePath);

        const fullOutputPath = await getUniqueFilename(resolvedResultsDir, filename, ".png");

        // 4. Prepare Inputs
        const sourceBase64 = await fileToBase64(fullSourcePath);
        let faceBase64 = undefined;
        if (faceReference) {
            const fullFacePath = resolvePath(faceReference);
            faceBase64 = await fileToBase64(fullFacePath);
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
        await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
        await fs.writeFile(fullOutputPath, buffer);

        // 6. Update Job in DB
        const relativeOutputPath = path.relative(basePath, fullOutputPath).replace(/\\/g, "/");

        await prisma.job.update({
            where: { id: dbJobId },
            data: {
                status: "COMPLETED",
                outputPaths: JSON.stringify([relativeOutputPath]),
            }
        });

        return NextResponse.json({
            success: true,
            path: relativeOutputPath,
            filename: path.basename(fullOutputPath)
        });

    } catch (error: any) {
        console.error("Model Swap API Error:", error);
        if (dbJobId) {
            try {
                await prisma.job.update({
                    where: { id: dbJobId },
                    data: {
                        status: "FAILED",
                        error: error.message || "Unknown error"
                    }
                });
            } catch (e) { }
        }
        return NextResponse.json({ error: error.message || "Failed to process swap" }, { status: 500 });
    }
}
