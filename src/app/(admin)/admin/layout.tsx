import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
                {children}
            </main>
        </div>
    );
}
