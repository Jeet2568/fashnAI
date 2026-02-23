"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Layers, CheckCircle, XCircle, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { getDashboardStats } from "@/app/(studio)/studio/actions";

interface StatsRowProps {
    className?: string;
}

export function StatsRow({ className }: StatsRowProps) {
    // Connect to global store for real data
    const { selectedFolder } = useStore();

    const [stats, setStats] = useState({
        queue: 0,
        today: 0,
        success: 0,
        fail: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getDashboardStats();
            if (data) setStats(data);
        };
        fetchStats();
        // optionally set up polling
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
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

            {/* Queue */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Queue</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.queue}</div>
                    <p className="text-xs text-muted-foreground">Pending Jobs</p>
                </CardContent>
            </Card>

            {/* Today Processed */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today Processed</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.today}</div>
                    <p className="text-xs text-muted-foreground">Total images</p>
                </CardContent>
            </Card>

            {/* Success */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-500">Success</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">{stats.success}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
            </Card>

            {/* Fail/Remake */}
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-500">Fail / Remake</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-500">{stats.fail}</div>
                    <p className="text-xs text-muted-foreground">Needs attention</p>
                </CardContent>
            </Card>
        </div>
    );
}
