
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createNotificationSchema = z.object({
    userId: z.string().min(1, "User is required"),
    message: z.string().min(1, "Message is required"),
});

export async function GET() {
    try {
        const notifications = await prisma.notification.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("[Notification POST] Body:", body); // Debug Log

        const { userId, message } = createNotificationSchema.parse(body);

        const notification = await prisma.notification.create({
            data: {
                userId,
                message,
                status: "SENT", // Default status
            },
            include: {
                user: {
                    select: { username: true }
                }
            }
        });

        console.log("[Notification POST] Created:", notification); // Debug Log
        return NextResponse.json(notification, { status: 201 });
    } catch (error: any) {
        console.error("[Notification POST] Error:", error); // Debug Log

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }

        // Return actual error for debugging
        return NextResponse.json(
            { error: error.message || "Failed to send notification" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const clearAll = searchParams.get("all");

        if (clearAll === "true") {
            // Delete all notifications
            await prisma.notification.deleteMany({});
            return NextResponse.json({ success: true });
        }

        if (id) {
            await prisma.notification.delete({
                where: { id },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: "ID or 'all' parameter required" },
            { status: 400 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete" },
            { status: 500 }
        );
    }
}
