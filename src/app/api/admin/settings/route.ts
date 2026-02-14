import { NextResponse } from "next/server";
import { setSetting, SETTINGS_KEYS } from "@/lib/settings";
import { z } from "zod";

const settingsSchema = z.object({
    nasRootPath: z.string().optional(),
    fashnApiKey: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nasRootPath, fashnApiKey } = settingsSchema.parse(body);

        if (nasRootPath !== undefined) {
            await setSetting(SETTINGS_KEYS.NAS_ROOT_PATH, nasRootPath);
        }

        if (fashnApiKey !== undefined) {
            // In a real app, you might want to encrypt this or store it differently
            // For now, we store it in the settings table
            await setSetting(SETTINGS_KEYS.FASHN_API_KEY, fashnApiKey);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save settings:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
