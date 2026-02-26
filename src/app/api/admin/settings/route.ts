import { NextResponse } from "next/server";
import { setSetting, SETTINGS_KEYS } from "@/lib/settings";
import { z } from "zod";
import { requireAdmin } from "@/lib/current-user";

const settingsSchema = z.object({
    nasRootPath: z.string().optional(),
    fashnApiKey: z.string().optional(),
    globalMarquee: z.string().optional(),
});

export async function POST(req: Request) {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    try {
        const body = await req.json();
        const { nasRootPath, fashnApiKey, globalMarquee } = settingsSchema.parse(body);

        if (nasRootPath !== undefined) {
            await setSetting(SETTINGS_KEYS.NAS_ROOT_PATH, nasRootPath);
        }

        if (fashnApiKey !== undefined) {
            await setSetting(SETTINGS_KEYS.FASHN_API_KEY, fashnApiKey);
        }

        if (globalMarquee !== undefined) {
            await setSetting(SETTINGS_KEYS.GLOBAL_MARQUEE, globalMarquee);
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
