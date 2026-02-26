import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";

export async function GET(req: Request) {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;

    try {
        const jobs = await prisma.job.findMany({
            where: { userId: auth.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ jobs });
    } catch (error) {
        console.error("History API Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
