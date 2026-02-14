import { StudioSidebar } from "@/components/studio-sidebar";

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <StudioSidebar />
            <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
                {children}
            </main>
        </div>
    );
}
