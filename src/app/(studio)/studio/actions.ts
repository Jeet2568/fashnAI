"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function getDashboardStats() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Queue: pending or processing
        const queueCount = await prisma.job.count({
            where: {
                userId: user.id,
                status: { in: ["PENDING", "PROCESSING", "STARTING"] }
            }
        });

        const todayJobs = await prisma.job.findMany({
            where: {
                userId: user.id,
                createdAt: { gte: startOfDay }
            },
            select: { status: true, inputParams: true }
        });

        let todayCount = 0;
        let successCount = 0;
        let failCount = 0;

        todayJobs.forEach(job => {
            let usage = 1;
            try {
                const params = JSON.parse(job.inputParams);
                if (params.type === "product-to-model" && params.prompts) {
                    const promptsArr = typeof params.prompts === 'string' ? JSON.parse(params.prompts) : params.prompts;
                    if (Array.isArray(promptsArr)) usage = promptsArr.length || 1;
                } else if (params.options?.num_samples) {
                    usage = Number(params.options.num_samples);
                } else if (params.num_samples) {
                    usage = Number(params.num_samples);
                }
            } catch (e) { }

            todayCount += usage;
            if (job.status === "COMPLETED") successCount += usage;
            if (job.status === "FAILED" || job.status === "CANCELED") failCount += usage;
        });

        return {
            queue: queueCount,
            today: todayCount,
            success: successCount,
            fail: failCount
        };
    } catch (error) {
        console.error("Error fetching stats:", error);
        return null;
    }
}
