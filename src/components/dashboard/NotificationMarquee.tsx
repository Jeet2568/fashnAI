"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

interface NotificationMarqueeProps {
    className?: string;
}

export function NotificationMarquee({ className }: NotificationMarqueeProps) {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                // Fetch Global Marquee first
                const settingsRes = await fetch("/api/settings", { cache: "no-store" });
                let marqueeMessages: string[] = [];
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    marqueeMessages = settingsData.marquee_messages || [];
                }

                const res = await fetch("/api/user/notifications", { cache: "no-store" });
                if (res.ok) {
                    const data: { message: string; status: string }[] = await res.json();
                    const notifMsgs = data.map(n => n.message);

                    const finalMsgs = [];
                    if (marqueeMessages.length > 0) {
                        finalMsgs.push(...marqueeMessages);
                    }
                    finalMsgs.push(...notifMsgs);

                    setMessages(finalMsgs);
                }
            } catch {
                setMessages([]);
            }
        };
        fetchNotifs();
        // Re-fetch every 60 seconds
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, []);

    if (messages.length === 0) return null;

    // Duplicate for seamless infinite scroll
    const display = [...messages, ...messages];

    return (
        <div className={cn("w-full bg-indigo-50 border border-indigo-100 rounded-lg overflow-hidden py-1.5 flex gap-2 items-center", className)}>
            <Bell className="w-3.5 h-3.5 text-indigo-400 ml-3 shrink-0" />
            <div className="overflow-hidden flex-1">
                <div className="animate-marquee flex shrink-0 min-w-full items-center gap-12">
                    {display.map((msg, i) => (
                        <span key={i} className="text-sm text-indigo-700 font-medium whitespace-nowrap">
                            {msg}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
