"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { fashnClient } from "@/lib/fashn/client";

export async function getAdminDashboardStats() {
    try {
        const admin = await getCurrentUser();
        if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
            return { error: "User is not logged in or not an Admin. Role: " + (admin?.role || "null") };
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Credits (Fetch directly from Fashn.ai API)
        let totalCredits = 0;
        try {
            const apiCredits = await fashnClient.getCredits();
            console.log("Fashn Credits Response:", apiCredits);
            totalCredits = Math.floor(apiCredits.credits?.total || 0);
        } catch (e) {
            console.error("Failed to fetch Fashn API credits:", e);
        }

        // 2. Active Jobs
        const activeJobs = await prisma.job.count({
            where: { status: { in: ["PENDING", "PROCESSING", "STARTING"] } }
        });

        // 3. Total Requests This Month
        const reqThisMonth = await prisma.job.count({
            where: { createdAt: { gte: startOfMonth } }
        });

        // 4. Success Rate This Month
        const completedThisMonth = await prisma.job.count({
            where: {
                createdAt: { gte: startOfMonth },
                status: "COMPLETED"
            }
        });
        const failedThisMonth = await prisma.job.count({
            where: {
                createdAt: { gte: startOfMonth },
                status: { in: ["FAILED", "CANCELED"] }
            }
        });
        const totalFinishedThisMonth = completedThisMonth + failedThisMonth;
        let successRate = 0;
        if (totalFinishedThisMonth > 0) {
            successRate = (completedThisMonth / totalFinishedThisMonth) * 100;
        }

        // 5. Active Users Today vs Total Users
        const totalUsers = await prisma.user.count();
        // Users who submitted a job today
        const activeUsersTodayList = await prisma.job.findMany({
            where: { createdAt: { gte: startOfDay } },
            select: { userId: true },
            distinct: ['userId']
        });
        const activeUsers = activeUsersTodayList.length;

        // 6. Today Processed
        const todayProcessed = await prisma.job.count({
            where: { createdAt: { gte: startOfDay } }
        });

        // 7. Today Failed
        const todayFailed = await prisma.job.count({
            where: {
                createdAt: { gte: startOfDay },
                status: { in: ["FAILED", "CANCELED"] }
            }
        });

        // 8. Queue List (Recent active/pending jobs)
        // Let's get up to 10 most recent jobs regardless of status, or prioritize pending?
        // AdminQueue UI shows recent jobs with user, task, status, time.
        const recentJobs = await prisma.job.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { username: true } } }
        });

        // Map recentJobs to the UI format
        const formatTimeAgo = (date: Date) => {
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return "Just now";
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHrs = Math.floor(diffMins / 60);
            if (diffHrs < 24) return `${diffHrs}h ago`;
            return `${Math.floor(diffHrs / 24)}d ago`;
        };

        const queueList = recentJobs.map(job => {
            // Task type is embedded in inputParams if it exists, otherwise generic "Job"
            let taskType = "Generative Task";
            try {
                const params = JSON.parse(job.inputParams);
                if (params.type) taskType = params.type;
            } catch (e) { }

            return {
                id: job.id,
                user: job.user.username,
                task: taskType,
                status: job.status.toLowerCase(),
                time: formatTimeAgo(job.createdAt)
            };
        });

        return {
            totalCredits,
            activeJobs,
            reqThisMonth,
            successRate: successRate.toFixed(1),
            usersActiveText: `${activeUsers} / ${totalUsers}`,
            todayProcessed,
            todayFailed,
            queueList,
        };

    } catch (error: any) {
        console.error("Error fetching Admin Dashboard Stats:", error);
        return { error: error.message || String(error) };
    }
}
