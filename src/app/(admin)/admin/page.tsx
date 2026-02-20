import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminActiveStatus } from "@/components/admin/AdminActiveStatus";
import { AdminActionPanel } from "@/components/admin/AdminActionPanel";
import { AdminQueue } from "@/components/admin/AdminQueue";
import { AdminQuickLinks } from "@/components/admin/AdminQuickLinks";

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of system status and usage.
                </p>
            </div>

            {/* Row 1: Top Stats */}
            <AdminStatsRow />

            {/* Row 2: Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AdminActiveStatus />
                        <AdminActionPanel />
                    </div>

                    <div className="mt-auto">
                        <AdminQuickLinks />
                    </div>
                </div>

                {/* Right Column (1/3 width) - Queue */}
                <div className="h-full min-h-0">
                    <AdminQueue />
                </div>
            </div>
        </div>
    );
}
