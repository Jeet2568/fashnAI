import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Visit /api/admin/debug-jobs to inspect what jobs are in the DB
// Shows last 50 jobs with timestamps and parsed type
export async function GET() {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const allJobs = await prisma.job.findMany({
            take: 50,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { username: true } } }
        });

        const summary = {
            serverTime: now.toISOString(),
            last24hCutoff: last24h.toISOString(),
            last7dCutoff: last7d.toISOString(),
            totalJobs: allJobs.length,
            jobsLast24h: allJobs.filter(j => j.createdAt >= last24h).length,
            jobsLast7d: allJobs.filter(j => j.createdAt >= last7d).length,
            jobs: allJobs.map(j => {
                let taskType = "unknown";
                try {
                    const p = JSON.parse(j.inputParams);
                    taskType = p.type || p.model_name || "generative";
                } catch { }
                return {
                    id: j.id,
                    user: j.user.username,
                    status: j.status,
                    type: taskType,
                    createdAt: j.createdAt.toISOString(),
                    minsAgo: Math.floor((now.getTime() - j.createdAt.getTime()) / 60000),
                };
            })
        };

        return NextResponse.json(summary, {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
