import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { fashnClient } from "@/lib/fashn/client";
import { requireAdmin } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ─── Each section wrapped independently so one failure doesn't kill all ───

    // 1. Credits from Fashn API
    let totalCredits = 0;
    let creditBreakdown = { subscription: 0, on_demand: 0, total: 0 };
    try {
        const c = await fashnClient.getCredits();
        creditBreakdown = {
            total: c.credits?.total ?? 0,
            subscription: c.credits?.subscription ?? 0,
            on_demand: c.credits?.on_demand ?? 0,
        };
        totalCredits = Math.floor(creditBreakdown.total);
    } catch (e) {
        console.error("[stats] credits fetch failed:", e);
    }

    // 2. Active jobs
    let activeJobs = 0;
    try {
        activeJobs = await prisma.job.count({
            where: { status: { in: ["PENDING", "PROCESSING", "STARTING"] } }
        });
    } catch (e) { console.error("[stats] activeJobs:", e); }

    // 3. All jobs (for all-time success + monthly totals)
    let reqThisMonth = 0;
    let completedThisMonth = 0;
    let failedThisMonth = 0;
    let completedAllTime = 0;
    let failedAllTime = 0;
    let successRate = "0.0";

    try {
        const allJobs = await prisma.job.findMany({
            select: { status: true, inputParams: true, createdAt: true }
        });

        for (const job of allJobs) {
            const usage = parseUsage(job.inputParams);
            const isCompleted = job.status === "COMPLETED";
            const isFailed = job.status === "FAILED" || job.status === "CANCELED";

            // All-time
            if (isCompleted) completedAllTime += usage;
            if (isFailed) failedAllTime += usage;

            // Last 30 days
            if (job.createdAt >= last30d) {
                reqThisMonth += usage;
                if (isCompleted) completedThisMonth += usage;
                if (isFailed) failedThisMonth += usage;
            }
        }

        const totalFinished = completedAllTime + failedAllTime;
        if (totalFinished > 0) {
            successRate = ((completedAllTime / totalFinished) * 100).toFixed(1);
        }
    } catch (e) { console.error("[stats] allJobs:", e); }

    // 4. User activity (last 24h) — avoid distinct, use JS dedup instead
    let usersActiveText = "0 / 0";
    let todayProcessed = 0;
    let todayFailed = 0;

    try {
        const [totalUsers, todayJobs] = await Promise.all([
            prisma.user.count(),
            prisma.job.findMany({
                where: { createdAt: { gte: last24h } },
                select: { userId: true, status: true, inputParams: true }
            })
        ]);

        const activeUserSet = new Set<string>();
        for (const job of todayJobs) {
            activeUserSet.add(job.userId);
            const usage = parseUsage(job.inputParams);
            todayProcessed += usage;
            if (job.status === "FAILED" || job.status === "CANCELED") todayFailed += usage;
        }

        usersActiveText = `${activeUserSet.size} / ${totalUsers}`;
    } catch (e) { console.error("[stats] userActivity:", e); }

    // 5. Recent job queue
    let queueList: any[] = [];
    try {
        const recentJobs = await prisma.job.findMany({
            take: 15,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { username: true } } }
        });

        queueList = recentJobs.map(job => ({
            id: job.id,
            user: job.user.username,
            task: parseTaskType(job.inputParams),
            status: job.status.toLowerCase(),
            time: formatTimeAgo(now, job.createdAt),
        }));
    } catch (e) { console.error("[stats] recentJobs:", e); }

    return NextResponse.json({
        totalCredits, creditBreakdown,
        activeJobs,
        reqThisMonth, completedThisMonth, failedThisMonth,
        completedAllTime, failedAllTime, successRate,
        usersActiveText, todayProcessed, todayFailed,
        queueList,
        _debug: { serverTime: now.toISOString(), window24h: last24h.toISOString() }
    });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseUsage(inputParams: string): number {
    try {
        const p = JSON.parse(inputParams);
        if (p.type === "product-to-model" && p.prompts) {
            const arr = typeof p.prompts === "string" ? JSON.parse(p.prompts) : p.prompts;
            return Array.isArray(arr) ? Math.max(arr.length, 1) : 1;
        }
        if (p.options?.num_samples) return Number(p.options.num_samples);
        if (p.num_samples) return Number(p.num_samples);
        if (p.num_images) return Number(p.num_images);
        if (p.configs) return Number(p.configs) || 1;
    } catch { /* ignore */ }
    return 1;
}

function parseTaskType(inputParams: string): string {
    try {
        const p = JSON.parse(inputParams);
        return p.type || p.model_name || "Generative Task";
    } catch { return "Generative Task"; }
}

function formatTimeAgo(now: Date, date: Date): string {
    const mins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
