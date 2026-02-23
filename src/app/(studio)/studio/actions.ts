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

        // Today's total jobs
        // We consider any job created today
        const todayCount = await prisma.job.count({
            where: {
                userId: user.id,
                createdAt: { gte: startOfDay }
            }
        });

        // Today's successful jobs
        const successCount = await prisma.job.count({
            where: {
                userId: user.id,
                status: "COMPLETED",
                createdAt: { gte: startOfDay }
            }
        });

        // Today's failed jobs
        const failCount = await prisma.job.count({
            where: {
                userId: user.id,
                status: { in: ["FAILED", "CANCELED"] },
                createdAt: { gte: startOfDay }
            }
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
