import fs from "fs/promises";

export async function fileToBase64(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
