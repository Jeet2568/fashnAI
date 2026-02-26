"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueItem {
    id: string;
    user: string;
    task: string;
    status: string;
    time: string;
}

const statusColor: Record<string, string> = {
    completed: "bg-green-100 text-green-700 border-green-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    starting: "bg-yellow-100 text-yellow-700 border-yellow-200",
    pending: "bg-zinc-100 text-zinc-600 border-zinc-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    canceled: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export function AdminQueue() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            if (data.queueList) setQueue(data.queueList);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Jobs</CardTitle>
                    {!loading && (
                        <span className="text-xs text-muted-foreground">{queue.length} entries</span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto px-3">
                {loading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : queue.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8 text-sm">No jobs found</div>
                ) : (
                    <div className="space-y-2">
                        {queue.map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-sm gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{job.user}</div>
                                    <div className="text-xs text-muted-foreground truncate">{job.task} · {job.time}</div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn("shrink-0 text-xs capitalize", statusColor[job.status] ?? "")}
                                >
                                    {job.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
