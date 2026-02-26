
import { NextResponse } from "next/server";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const marquee = await getSetting(SETTINGS_KEYS.GLOBAL_MARQUEE, "");

        let marqueeMessages: string[] = [];
        try {
            if (marquee.startsWith("[")) {
                marqueeMessages = JSON.parse(marquee);
            } else if (marquee) {
                marqueeMessages = [marquee];
            }
        } catch {
            marqueeMessages = marquee ? [marquee] : [];
        }

        return NextResponse.json({
            marquee_text: marqueeMessages.join(" • "),
            marquee_messages: marqueeMessages
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}
