import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

// Base path fallback
const DEFAULT_BASE_PATH = process.env.NAS_ROOT_PATH || "";

const mkdirSchema = z.object({
    path: z.string(),
    subfolders: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { path: relPath, subfolders } = mkdirSchema.parse(body);

        const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, DEFAULT_BASE_PATH);

        if (!basePath) {
            return NextResponse.json({ error: "Storage path not configured", code: "NO_CONFIG" }, { status: 400 });
        }

        // Security check
        if (relPath.includes("..")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
        }

        const fullPath = path.join(basePath, relPath);

        // Create main directory
        await fs.mkdir(fullPath, { recursive: true });

        // Create subfolders if requested
        if (subfolders && subfolders.length > 0) {
            await Promise.all(
                subfolders.map(folder => {
                    if (folder.includes("/") || folder.includes("..")) return Promise.resolve(); // Simple security check
                    return fs.mkdir(path.join(fullPath, folder), { recursive: true });
                })
            );
        }

        return NextResponse.json({ success: true, path: relPath });
    } catch (error) {
        console.error("Error creating directory:", error);
        return NextResponse.json(
            { error: "Failed to create directory" },
            { status: 500 }
        );
    }
}
