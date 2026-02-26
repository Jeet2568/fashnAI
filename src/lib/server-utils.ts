import fs from "fs/promises";
import path from "path";

export function determineResultsDir(sourceFilePath: string): string {
    const dir = path.dirname(sourceFilePath);
    // Split by both forward and backward slashes to handle mixed paths safely
    const parts = dir.split(/[/\\]/);

    const rawIndex = parts.findIndex(part => part.toUpperCase() === "RAW");
    const resultsIndex = parts.findIndex(part => part.toUpperCase() === "RESULTS");

    if (rawIndex !== -1) {
        // Find the RAW folder and replace it with Results, but stop there (flatten subfolders)
        // e.g. A/B/RAW/Sub/file.jpg -> A/B/Results
        const baseParts = parts.slice(0, rawIndex);
        return [...baseParts, "Results"].join("/");
    }

    if (resultsIndex !== -1) {
        // Already in a Results folder, don't nest further
        return dir.replace(/\\/g, "/");
    }

    // Fallback: Create Results folder in current directory if RAW or Results not found
    return path.join(dir, "Results").replace(/\\/g, "/");
}

export async function fileToBase64(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export async function getUniqueFilename(dir: string, baseName: string, ext: string): Promise<string> {
    await fs.mkdir(dir, { recursive: true });
    let fileName = `${baseName}${ext}`;
    let fullPath = path.join(dir, fileName);
    let counter = 1;

    while (true) {
        try {
            await fs.access(fullPath);
            fileName = `${baseName}_${counter}${ext}`;
            fullPath = path.join(dir, fileName);
            counter++;
        } catch {
            return fullPath;
        }
    }
}
