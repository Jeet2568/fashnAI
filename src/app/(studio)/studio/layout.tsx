import { StudioSidebar } from "@/components/studio-sidebar";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

export default async function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <StudioSidebar />
            <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
                {children}
            </main>
        </div>
    );
}
