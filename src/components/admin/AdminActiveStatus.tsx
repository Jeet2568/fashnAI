"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/app/(admin)/admin/actions";

export function AdminActiveStatus() {
    const [stats, setStats] = useState({
        usersActiveText: "0 / 0",
        todayProcessed: 0,
        todayFailed: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getAdminDashboardStats();
            if (data) {
                setStats({
                    usersActiveText: data.usersActiveText || "0 / 0",
                    todayProcessed: data.todayProcessed || 0,
                    todayFailed: data.todayFailed || 0
                });
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="grid gap-4">
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">Users Active</div>
                    <div className="text-xl font-bold">{stats.usersActiveText}</div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">Today Processed</div>
                    <div className="text-xl font-bold">{stats.todayProcessed}</div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">Today Failed</div>
                    <div className="text-xl font-bold text-red-600">{stats.todayFailed}</div>
                </CardContent>
            </Card>
        </div>
    );
}
