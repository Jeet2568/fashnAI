import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Rolling 24h window — avoids UTC vs IST timezone mismatch
        const startOfDay = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

        // Queue: pending / processing
        const queue = await prisma.job.count({
            where: {
                userId: user.id,
                status: { in: ["PENDING", "PROCESSING", "STARTING"] }
            }
        });

        const todayJobs = await prisma.job.findMany({
            where: { userId: user.id, createdAt: { gte: startOfDay } },
            select: { status: true, inputParams: true }
        });

        let today = 0, success = 0, fail = 0;
        for (const job of todayJobs) {
            const usage = parseUsage(job.inputParams);
            today += usage;
            if (job.status === "COMPLETED") success += usage;
            if (job.status === "FAILED" || job.status === "CANCELED") fail += usage;
        }

        // User credits
        const credits = user.credits ?? 0;

        return NextResponse.json({ queue, today, success, fail, credits });
    } catch (error: any) {
        console.error("[/api/studio/stats]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function parseUsage(inputParams: string): number {
    try {
        const params = JSON.parse(inputParams);
        if (params.type === "product-to-model" && params.prompts) {
            const arr = typeof params.prompts === "string" ? JSON.parse(params.prompts) : params.prompts;
            return Array.isArray(arr) ? Math.max(arr.length, 1) : 1;
        }
        if (params.options?.num_samples) return Number(params.options.num_samples);
        if (params.num_samples) return Number(params.num_samples);
        if (params.num_images) return Number(params.num_images);
    } catch { /* ignore */ }
    return 1;
}
