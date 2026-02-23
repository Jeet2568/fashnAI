import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Mark them as READ when fetched (optional, but good for read-receipts)
        await prisma.notification.updateMany({
            where: {
                userId: userId,
                status: "SENT"
            },
            data: {
                status: "READ"
            }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("[User Notifications GET API]", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}
