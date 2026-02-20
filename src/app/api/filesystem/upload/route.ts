import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

const DEFAULT_BASE_PATH = process.env.NAS_ROOT_PATH || "";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "_uploads"; // Default folder

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, DEFAULT_BASE_PATH);
        if (!basePath) {
            return NextResponse.json({ error: "Storage path not configured" }, { status: 500 });
        }

        // Create target directory
        const uploadDir = path.join(basePath, folder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate safe filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${timestamp}_${safeName}`;
        const filePath = path.join(uploadDir, fileName);

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Write file
        fs.writeFileSync(filePath, buffer);

        // Return relative path for use in API
        const relativePath = path.join(folder, fileName).replace(/\\/g, "/");

        return NextResponse.json({
            success: true,
            path: relativePath,
            url: `/api/filesystem/image?path=${encodeURIComponent(relativePath)}`
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
