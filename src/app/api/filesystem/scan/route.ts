import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

const DEFAULT_BASE_PATH = process.env.NAS_ROOT_PATH || "";

// Helper to recursively finding folders at a specific depth
async function findFoldersAtDepth(baseStart: string, currentDepth: number, targetDepth: number): Promise<any[]> {
    if (currentDepth === targetDepth) {
        // We reached the target depth. Return these folders.
        // We need to return their relative path and name.
        // But wait, we need to list the folders inside the CURRENT path?
        // No, the caller passed a path. If that path IS at target depth, we return it?
        // The implementation below assumes we are recursively called.
        return [];
    }

    try {
        const entries = await fs.readdir(baseStart, { withFileTypes: true });
        const folders = entries.filter(e => e.isDirectory());

        // If next level is the target, these folders ARE the target items
        if (currentDepth + 1 === targetDepth) {
            return folders.map(f => ({
                name: f.name,
                path: f.name, // We need full relative path... logic below is flawed for recursion
                fullPath: path.join(baseStart, f.name)
            }));
        }

        // Otherwise recurse
        let results: any[] = [];
        for (const folder of folders) {
            const children = await findFoldersAtDepth(path.join(baseStart, folder.name), currentDepth + 1, targetDepth);
            results = results.concat(children);
        }
        return results;
    } catch (e) {
        return [];
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const rootRel = searchParams.get("root") || "CodeVeda AI";
    const depth = parseInt(searchParams.get("depth") || "3", 10);

    const basePath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH, DEFAULT_BASE_PATH);
    if (!basePath) return NextResponse.json({ error: "No config" }, { status: 400 });

    const startPath = path.join(basePath, rootRel);

    try {
        // We need a proper recursive function that maintains relative paths
        const results: any[] = [];

        async function recurse(dir: string, curLevel: number) {
            if (curLevel >= depth) return; // Should not happen if logic is right

            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                const folders = entries.filter(e => e.isDirectory());

                for (const folder of folders) {
                    const fullChildPath = path.join(dir, folder.name);
                    const relChildPath = path.relative(basePath, fullChildPath).replace(/\\/g, "/");

                    if (curLevel + 1 === depth) {
                        // Found a target
                        results.push({
                            name: folder.name,
                            path: relChildPath,
                            parent: path.basename(dir)
                        });
                    } else {
                        // Go deeper
                        await recurse(fullChildPath, curLevel + 1);
                    }
                }
            } catch (e) {
                // Ignore errors (access denied, etc)
            }
        }

        await recurse(startPath, 0);

        return NextResponse.json({ files: results });
    } catch (e) {
        return NextResponse.json({ error: "Scan failed" }, { status: 500 });
    }
}
