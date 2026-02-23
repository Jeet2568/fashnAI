"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
    id: string;
    message: string;
    createdAt: string;
    status: string;
}

export default function UserNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            } else {
                toast.error("Failed to load notifications");
            }
        } catch (error) {
            toast.error("An error occurred while loading notifications");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col p-8 bg-zinc-50/50">
            <div className="flex items-center gap-3 pb-6 border-b border-zinc-200">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Notifications</h2>
                    <p className="text-sm text-zinc-500">
                        Updates, alerts, and messages from the admin team.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <span className="text-sm text-zinc-500">Checking for new messages...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400 bg-white border-2 border-dashed border-zinc-200 rounded-xl">
                        <Bell className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium text-zinc-600">You're all caught up!</p>
                        <p className="text-sm text-zinc-400">No new notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <Card key={notif.id} className="border-l-4 border-l-indigo-600 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-zinc-900 leading-relaxed whitespace-pre-wrap">
                                            {notif.message}
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-500 font-medium">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
