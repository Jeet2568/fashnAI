"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminDashboardStats } from "@/app/(admin)/admin/actions";

interface QueueItem {
    id: string;
    user: string;
    task: string;
    status: string;
    time: string;
}

export function AdminQueue() {
    const [queue, setQueue] = useState<QueueItem[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getAdminDashboardStats();
            if (data && data.queueList) {
                setQueue(data.queueList);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Queue</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pl-2 pr-2">
                <div className="space-y-3">
                    {queue.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">Queue is empty</div>
                    ) : (
                        queue.map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/40 text-sm">
                                <div>
                                    <div className="font-medium">{job.user}</div>
                                    <div className="text-xs text-muted-foreground">{job.task} • {job.time}</div>
                                </div>
                                <Badge variant={job.status === "processing" ? "default" : "secondary"}>
                                    {job.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
