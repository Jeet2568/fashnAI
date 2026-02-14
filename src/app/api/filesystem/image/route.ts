import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

const DEFAULT_BASE_PATH = process.env.NAS_ROOT_PATH || "";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get("path");

    if (!relPath) {
        return new NextResponse("Missing path", { status: 400 });
    }

    // Security check
    if (relPath.includes("..")) {
        return new NextResponse("Invalid path", { status: 400 });
    }

    const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, DEFAULT_BASE_PATH);

    if (!basePath) {
        return new NextResponse("Storage path not configured", { status: 400 });
    }

    const fullPath = path.join(basePath, relPath);

    try {
        if (!fs.existsSync(fullPath)) {
            // console.error(`File not found: ${fullPath}`);
            return new NextResponse("File not found", { status: 404 });
        }

        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) {
            return new NextResponse("Not a file", { status: 400 });
        }

        const fileBuffer = fs.readFileSync(fullPath);
        const contentType = mime.getType(fullPath) || "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
