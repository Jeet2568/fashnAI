import fs from "fs/promises";
import path from "path";

export function determineResultsDir(sourceFilePath: string): string {
    const dir = path.dirname(sourceFilePath);
    // Split by both forward and backward slashes to handle mixed paths safely
    const parts = dir.split(/[/\\]/);

    const rawIndex = parts.findIndex(part => part.toUpperCase() === "RAW");

    if (rawIndex !== -1) {
        // Replace RAW with Results to mirror structure (e.g. RAW/01 -> Results/01)
        parts[rawIndex] = "Results";
        // Rejoin using the system-specific separator
        return parts.join(path.sep);
    }

    // Fallback: Create Results folder in current directory if RAW not found
    return path.join(dir, "Results");
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
