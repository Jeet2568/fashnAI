"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Image,
    PenTool,
    Database,
    Shirt,
    LogOut,
    Bell,
    UserCircle,
    Settings
} from "lucide-react";
import { logout } from "@/app/actions";
import { useRouter } from "next/navigation";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Client",
        href: "/admin/clients",
        icon: UserCircle,
    },
    {
        title: "Gallery",
        href: "/admin/gallery",
        icon: Image,
    },
    {
        title: "Edit",
        href: "/admin/edit",
        icon: PenTool,
    },
    {
        title: "Resources",
        href: "/admin/resources",
        icon: Database,
    },
    {
        title: "Models",
        href: "/admin/models",
        icon: Shirt,
    },
    {
        title: "Users",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="bg-black rounded p-1">
                        <Shirt className="h-4 w-4 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Studio<span className="font-light">AI</span></h1>
                </Link>
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-3">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                pathname === item.href ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 space-y-2 border-t">
                {/* Notifications Button */}
                {/* Notifications Link */}
                <Link
                    href="/admin/notifications"
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === "/admin/notifications" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground"
                    )}
                >
                    <Bell className="h-4 w-4" />
                    Notifications
                </Link>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                >
                    <LogOut className="h-4 w-4" />
                    Log Out
                </button>
            </div>
        </div>
    );
}
