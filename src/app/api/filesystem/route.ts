import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

// Base path for NAS / Shared Drive fallback
const DEFAULT_BASE_PATH = process.env.NAS_ROOT_PATH || "";

// Ensure DEFAULT_BASE_PATH exists in dev
try {
    fs.mkdir(DEFAULT_BASE_PATH, { recursive: true });
} catch (e) { }

const listSchema = z.object({
    path: z.string().optional().default(""),
});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get("path") || "";

    // Fetch dynamic base path from settings
    const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, DEFAULT_BASE_PATH);

    if (!basePath) {
        return NextResponse.json({ error: "Storage path not configured", code: "NO_CONFIG" }, { status: 400 });
    }

    // Security check: prevent directory traversal
    if (relPath.includes("..")) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const fullPath = path.join(basePath, relPath);
    console.log("Filesystem API Debug:", { basePath, relPath, fullPath });

    try {
        // Create directory if it doesn't exist (for the root path)
        if (relPath === "" && basePath === DEFAULT_BASE_PATH) {
            try { await fs.mkdir(basePath, { recursive: true }); } catch (e) { }
        }

        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
            return NextResponse.json({ error: "Not a directory" }, { status: 400 });
        }

        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        const files = entries.map((entry) => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            path: path.join(relPath, entry.name).replace(/\\/g, "/"),
            // We could add size/date if needed
        }));

        // Sort: Directories first, then files
        files.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });

        return NextResponse.json({
            path: relPath,
            files
        });
    } catch (error) {
        console.error("Error reading directory:", error);
        return NextResponse.json(
            { error: "Failed to read directory" },
            { status: 500 }
        );
    }
}

const moveSchema = z.object({
    sourcePath: z.string(),
    destPath: z.string(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sourcePath, destPath } = moveSchema.parse(body);

        const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, DEFAULT_BASE_PATH);

        if (sourcePath.includes("..") || destPath.includes("..")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
        }

        const fullSource = path.join(basePath, sourcePath);
        const fullDest = path.join(basePath, destPath);

        await fs.rename(fullSource, fullDest);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to move file" },
            { status: 500 }
        );
    }
}
