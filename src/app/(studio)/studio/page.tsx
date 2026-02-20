"use client";

import { FileExplorer } from "@/components/file-explorer";
import { NotificationMarquee } from "@/components/dashboard/NotificationMarquee";
import { StatsRow } from "@/components/dashboard/StatsRow";

export default function StudioPage() {
    return (
        <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
            {/* Top Bar: Marquee */}
            <NotificationMarquee />

            {/* Stats Row */}
            <StatsRow />

            {/* Main Content: File Explorer (Split View) */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <FileExplorer className="h-full" onSelectFolder={() => { }} variant="split" />
            </div>
        </div>
    );
}
