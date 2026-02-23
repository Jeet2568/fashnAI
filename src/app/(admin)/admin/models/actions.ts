"use server";

import { fashnClient } from "@/lib/fashn/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { fileToBase64, getUniqueFilename } from "@/lib/server-utils";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";
import path from "path";
import fs from "fs/promises";

export async function runModelGen(formData: FormData) {
    try {
        const user = await getCurrentUser(); // Ensure auth

        const faceImage = formData.get("faceImage") as string;
        const poseImage = formData.get("poseImage") as string;
        const prompt = formData.get("prompt") as string;
        const ratio = formData.get("ratio") as string;
        const quality = formData.get("quality") as string;
        const numImages = parseInt(formData.get("numImages") as string || "1");

        // Resolve paths (assuming they are typically NAS paths from FileUploader)
        // Adjust logic if FileUploader returns full URLs or relative paths
        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");

        const resolvePath = (p: string) => {
            if (p.startsWith("http")) return p; // Assume URL accessible to Fashn? Usually not for local.
            // If it's a relative path from File system API:
            const clean = p.replace("/api/filesystem/image?path=", "").split('?')[0]; // simple cleanup
            const decoded = decodeURIComponent(clean);
            if (path.isAbsolute(decoded)) return decoded;
            return path.join(nasRoot, decoded);
        };

        const absFacePath = faceImage ? resolvePath(faceImage) : "";
        const absPosePath = poseImage ? resolvePath(poseImage) : "";

        // Convert to Base64 for API
        const faceB64 = absFacePath ? await fileToBase64(absFacePath) : undefined;
        const poseB64 = absPosePath ? await fileToBase64(absPosePath) : undefined;

        // Call Model Create
        // "Pose Reference" is the 'image_reference' (target body/pose)
        // "Face Reference" is the 'face_reference' (source identity)
        const response = await fashnClient.runModelCreate({
            image_reference: poseB64,
            face_reference: faceB64,
            prompt: prompt ? prompt : undefined,
            face_reference_mode: "match_reference", // Enforce strong likeness
            aspect_ratio: ratio as any,
            return_base64: false
            // output_format?
        });

        const jobId = response.id;
        let status = response.status;
        let outputUrls: string[] = [];

        // Poll
        for (let i = 0; i < 60; i++) {
            if (status === "completed" || status === "failed") break;
            await new Promise(r => setTimeout(r, 2000));
            const poll = await fashnClient.getStatus(jobId);
            status = poll.status;
            if (status === "completed") outputUrls = poll.output || [];
            if (status === "failed") throw new Error(poll.error || "Generation failed");
        }

        if (!outputUrls.length) throw new Error("No output generated");

        return { success: true, urls: outputUrls };

    } catch (error: any) {
        console.error("Model Gen Error:", error);
        return { success: false, error: error.message };
    }
}

export async function saveGeneratedModel(imageUrl: string, name: string) {
    try {
        const user = await getCurrentUser();
        const nasRoot = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, process.env.NAS_ROOT_PATH || "");

        // Target Directory: _models (system folder) or just Models?
        // Let's use a root 'Models' folder for visibility in Studio
        const modelsDir = path.join(nasRoot, "Models");
        await fs.mkdir(modelsDir, { recursive: true });

        const filename = `${name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.jpg`;
        const outputPath = path.join(modelsDir, filename);
        const relPath = path.join("Models", filename);

        // Download and Save
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

        // Create Resource Record
        const resource = await prisma.resource.create({
            data: {
                type: "model",
                name: name,
                prompt: "Generated Model",
                thumbnail: `/api/filesystem/image?path=${encodeURIComponent(relPath.replace(/\\/g, '/'))}`, // Serve via FS API
                // We might want to store the actual path too if Resource table supported it, 
                // but currently it relies on 'thumbnail' field acting as the reference often?
                // Actually Resource table has: id, type, name, prompt, thumbnail.
                // For 'model' type, 'thumbnail' usually points to the image itself.
            }
        });

        return { success: true, resource };

    } catch (error: any) {
        console.error("Save Model Error:", error);
        return { success: false, error: error.message };
    }
}
