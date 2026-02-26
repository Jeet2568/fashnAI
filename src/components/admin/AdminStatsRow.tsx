"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, HardDrive, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface AdminStats {
    totalCredits: number;
    creditBreakdown?: { subscription: number; on_demand: number; total: number };
    activeJobs: number;
    reqThisMonth: number;
    completedThisMonth: number;
    failedThisMonth: number;
    completedAllTime: number;
    failedAllTime: number;
    successRate: string;
    error?: string;
}

export function AdminStatsRow() {
    const [stats, setStats] = useState<AdminStats>({
        totalCredits: 0,
        activeJobs: 0,
        reqThisMonth: 0,
        completedThisMonth: 0,
        failedThisMonth: 0,
        completedAllTime: 0,
        failedAllTime: 0,
        successRate: "0.0",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setStats(data);
            setError(null);
        } catch (e: any) {
            setError(e.message || "Failed to load stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    const val = (v: React.ReactNode) =>
        loading
            ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            : <div className="text-2xl font-bold">{v}</div>;

    const bd = stats.creditBreakdown;

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                    <strong>Stats Error:</strong> {error}
                </div>
            )}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">

                {/* API Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Live</div>
                        <p className="text-xs text-muted-foreground">Fashn.ai Connected</p>
                    </CardContent>
                </Card>

                {/* Credits — shows total with sub/on-demand breakdown */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {val(stats.totalCredits.toLocaleString())}
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {bd
                                ? `Sub: ${bd.subscription} · On-demand: ${bd.on_demand}`
                                : "Available balance"}
                        </p>
                    </CardContent>
                </Card>

                {/* Active Jobs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {val(stats.activeJobs)}
                        <p className="text-xs text-muted-foreground">Running now</p>
                    </CardContent>
                </Card>

                {/* Total Requests this month */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Req</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {val(stats.reqThisMonth.toLocaleString())}
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>

                {/* Completed all-time */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {val(<span className="text-green-600">{stats.completedAllTime}</span>)}
                        <p className="text-xs text-muted-foreground">
                            This month: {stats.completedThisMonth}
                        </p>
                    </CardContent>
                </Card>

                {/* Failed + success rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <div className="flex gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <XCircle className="h-4 w-4 text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {val(<span className={Number(stats.successRate) < 80 ? "text-red-600" : "text-green-600"}>{stats.successRate}%</span>)}
                        <p className="text-xs text-muted-foreground">
                            {stats.failedAllTime} failed all-time
                        </p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
