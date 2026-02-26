"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AdminActiveStatus() {
    const [stats, setStats] = useState({
        usersActiveText: "— / —",
        todayProcessed: 0,
        todayFailed: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            if (!data.error) {
                setStats({
                    usersActiveText: data.usersActiveText ?? "0 / 0",
                    todayProcessed: data.todayProcessed ?? 0,
                    todayFailed: data.todayFailed ?? 0,
                });
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
        loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="text-xl font-bold">{v}</div>;

    return (
        <div className="grid gap-4">
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div>
                        <div className="font-medium">Active Users</div>
                        <div className="text-xs text-muted-foreground">Last 24h / Total</div>
                    </div>
                    {val(stats.usersActiveText)}
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div>
                        <div className="font-medium">Processed</div>
                        <div className="text-xs text-muted-foreground">Last 24h</div>
                    </div>
                    {val(stats.todayProcessed)}
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div>
                        <div className="font-medium">Failed</div>
                        <div className="text-xs text-muted-foreground">Last 24h</div>
                    </div>
                    {val(<span className={stats.todayFailed > 0 ? "text-red-600" : ""}>{stats.todayFailed}</span>)}
                </CardContent>
            </Card>
        </div>
    );
}
