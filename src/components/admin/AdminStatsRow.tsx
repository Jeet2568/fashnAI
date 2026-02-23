"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, HardDrive, CheckCircle2, XCircle } from "lucide-react";
import { getAdminDashboardStats } from "@/app/(admin)/admin/actions";

export function AdminStatsRow() {
    const [stats, setStats] = useState({
        totalCredits: 0,
        activeJobs: 0,
        reqThisMonth: 0,
        successRate: "0.0",
        error: null as string | null
    });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getAdminDashboardStats();
            if (data && data.error) {
                setStats(prev => ({ ...prev, error: data.error }));
                return;
            }
            if (data) {
                setStats({
                    totalCredits: data.totalCredits ?? 0,
                    activeJobs: data.activeJobs ?? 0,
                    reqThisMonth: data.reqThisMonth ?? 0,
                    successRate: data.successRate ?? "0.0",
                    error: null
                });
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="space-y-4">
            {stats.error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg font-mono text-sm">
                    <strong>Dashboard Sync Error:</strong> {stats.error}
                </div>
            )}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Operational</div>
                        <p className="text-xs text-muted-foreground">Tier: Enterprise</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Use</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeJobs}</div>
                        <p className="text-xs text-muted-foreground">Active Jobs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Req</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.reqThisMonth.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">This Month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success/Fail</CardTitle>
                        <div className="flex gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <XCircle className="h-4 w-4 text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.successRate}%</div>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
