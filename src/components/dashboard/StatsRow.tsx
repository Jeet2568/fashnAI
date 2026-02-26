"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Layers, CheckCircle, XCircle, Clock, CreditCard, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";

interface StatsRowProps {
    className?: string;
}

interface Stats {
    queue: number;
    today: number;
    success: number;
    fail: number;
    credits: number;
}

export function StatsRow({ className }: StatsRowProps) {
    const { selectedFolder } = useStore();

    const [stats, setStats] = useState<Stats>({ queue: 0, today: 0, success: 0, fail: 0, credits: 0 });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/studio/stats", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    const val = (v: React.ReactNode) =>
        loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <div className="text-2xl font-bold">{v}</div>;

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-6 gap-4 ${className}`}>
            {/* Current Folder */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Folder</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate" title={selectedFolder || "None"}>
                        {selectedFolder ? selectedFolder.split(/[/\\]/).pop() : "Root"}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {selectedFolder || "No folder selected"}
                    </p>
                </CardContent>
            </Card>

            {/* Credits */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credits</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {val(stats.credits.toLocaleString())}
                    <p className="text-xs text-muted-foreground">Available</p>
                </CardContent>
            </Card>

            {/* Queue */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Queue</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {val(stats.queue)}
                    <p className="text-xs text-muted-foreground">Pending Jobs</p>
                </CardContent>
            </Card>

            {/* Today Processed */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {val(stats.today)}
                    <p className="text-xs text-muted-foreground">Processed</p>
                </CardContent>
            </Card>

            {/* Success */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Success</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    {val(<span className="text-green-600">{stats.success}</span>)}
                    <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
            </Card>

            {/* Fail */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-500">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    {val(<span className={stats.fail > 0 ? "text-red-500" : ""}>{stats.fail}</span>)}
                    <p className="text-xs text-muted-foreground">Needs attention</p>
                </CardContent>
            </Card>
        </div>
    );
}
