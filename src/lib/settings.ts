import { db as prisma } from "@/lib/db";

export const SETTINGS_KEYS = {
    NAS_ROOT_PATH: "nas_root_path",
    FASHN_API_KEY: "fashn_api_key",
    GLOBAL_MARQUEE: "global_marquee",
};

export async function getSetting(key: string, defaultValue = ""): Promise<string> {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key },
        });
        return setting?.value || defaultValue;
    } catch (error) {
        console.warn(`Failed to fetch setting ${key}:`, error);
        return defaultValue;
    }
}

export async function setSetting(key: string, value: string) {
    return prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}
