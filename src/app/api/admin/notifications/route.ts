
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const createNotificationSchema = z.object({
    userId: z.string().min(1, "User is required"),
    message: z.string().min(1, "Message is required"),
});

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

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
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    try {
        const body = await req.json();
        const { userId, message } = createNotificationSchema.parse(body);
        let notification;

        if (userId === "ALL") {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            await prisma.notification.createMany({
                data: allUsers.map(u => ({
                    userId: u.id,
                    message,
                    status: "SENT"
                }))
            });
            notification = { userId: "ALL", message, status: "SENT", user: { username: "ALL USERS" } };
        } else {
            notification = await prisma.notification.create({
                data: { userId, message, status: "SENT" },
                include: { user: { select: { username: true } } }
            });
        }

        return NextResponse.json(notification, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || "Failed to send notification" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const clearAll = searchParams.get("all");

        if (clearAll === "true") {
            await prisma.notification.deleteMany({});
            return NextResponse.json({ success: true });
        }

        if (id) {
            await prisma.notification.delete({ where: { id } });
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
