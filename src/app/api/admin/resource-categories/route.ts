import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SETTING_KEY = "resource_categories";

// Default categories if none exist
const DEFAULT_CATEGORIES = [
    { label: "Poses", value: "pose", thumbnail: "" },
    { label: "Backgrounds", value: "background", thumbnail: "" },
    { label: "Accessories", value: "accessory", thumbnail: "" },
    { label: "Camera Angles", value: "camera_angle", thumbnail: "" },
];

export async function GET() {
    try {
        const setting = await db.systemSettings.findUnique({
            where: { key: SETTING_KEY },
        });

        if (!setting) {
            // Return defaults but don't save them yet to avoid noise
            return NextResponse.json(DEFAULT_CATEGORIES);
        }

        return NextResponse.json(JSON.parse(setting.value));
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Body should be the full array of categories

        await db.systemSettings.upsert({
            where: { key: SETTING_KEY },
            update: { value: JSON.stringify(body) },
            create: { key: SETTING_KEY, value: JSON.stringify(body) },
        });

        return NextResponse.json({ success: true, categories: body });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save categories" }, { status: 500 });
    }
}
