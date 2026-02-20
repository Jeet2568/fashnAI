"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NotificationMarqueeProps {
    className?: string;
    messages?: string[];
}

export function NotificationMarquee({ className, messages = [] }: NotificationMarqueeProps) {
    const defaultMessages = [
        "Welcome to CodeVeda AI Studio",
        "System Status: Operational",
        "Queue Load: Low",
        "New Feature: Try-On v1.6 is live!"
    ];

    const displayMessages = messages.length > 0 ? messages : defaultMessages;

    return (
        <div className={cn("w-full bg-secondary/30 border-b border-border overflow-hidden py-1.5", className)}>
            <div className="relative w-full flex whitespace-nowrap overflow-hidden">
                <div className="animate-marquee inline-block">
                    {displayMessages.map((msg, i) => (
                        <span key={i} className="mx-8 text-sm text-muted-foreground font-medium">
                            {msg}
                        </span>
                    ))}
                </div>
                <div className="animate-marquee inline-block absolute top-0 left-full">
                    {displayMessages.map((msg, i) => (
                        <span key={`dup-${i}`} className="mx-8 text-sm text-muted-foreground font-medium">
                            {msg}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
