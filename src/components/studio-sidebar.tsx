"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    FileImage,
    Home,
    LayoutDashboard,
    PenTool,
    Shirt,
    History,
    Camera,
    User,
    LogOut,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function StudioSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isStudioOpen, setIsStudioOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const checkActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-background text-slate-900 border-r">
            <div className="px-3 py-2 flex-1">
                <Link href="/studio" className="flex items-center pl-3 mb-8">
                    <div className="relative w-8 h-8 mr-2 bg-black rounded-lg flex items-center justify-center">
                        <Shirt className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold">
                        Studio<span className="font-light">AI</span>
                    </h1>
                </Link>

                <div className="space-y-1">
                    {/* Home */}
                    <Link
                        href="/studio"
                        className={cn(
                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                            pathname === "/studio" ? "bg-accent text-accent-foreground" : "text-slate-600"
                        )}
                    >
                        <div className="flex items-center flex-1">
                            <Home className="h-4 w-4 mr-3" />
                            Home
                        </div>
                    </Link>

                    {/* Studio Section */}
                    <div>
                        <button
                            onClick={() => setIsStudioOpen(!isStudioOpen)}
                            className="text-sm group flex p-3 w-full justify-between items-center font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1 text-slate-600"
                        >
                            <div className="flex items-center">
                                <Camera className="h-4 w-4 mr-3" />
                                Studio
                            </div>
                            <ChevronDown className={cn("h-3 w-3 transition-transform", isStudioOpen ? "rotate-180" : "")} />
                        </button>

                        <div className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            isStudioOpen ? "max-h-48 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                        )}>
                            <div className="pl-4 space-y-1 ml-2 border-l border-slate-200">
                                <Link
                                    href="/studio/advanced"
                                    className={cn(
                                        "text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                                        checkActive("/studio/advanced") ? "bg-accent text-accent-foreground" : "text-slate-600"
                                    )}
                                >
                                    <div className="flex items-center flex-1">
                                        <Shirt className="h-4 w-4 mr-3" /> {/* Or another appropriate icon */}
                                        Advanced Gen
                                    </div>
                                </Link>


                                <button
                                    onClick={() => toast.info("Coming soon...")}
                                    className="text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1 text-slate-600"
                                >
                                    <div className="flex items-center flex-1">
                                        <Shirt className="h-4 w-4 mr-3" />
                                        Product
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tools / Others */}
                    <div className="pt-4">
                        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tools</p>
                        <Link
                            href="/studio/gallery"
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                                checkActive("/studio/gallery") ? "bg-accent text-accent-foreground" : "text-slate-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <FileImage className="h-4 w-4 mr-3" />
                                Gallery
                            </div>
                        </Link>
                        <Link
                            href="/studio/edit"
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                                checkActive("/studio/edit") ? "bg-accent text-accent-foreground" : "text-slate-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <PenTool className="h-4 w-4 mr-3" />
                                Edit
                            </div>
                        </Link>
                        <Link
                            href="/studio/resources"
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                                checkActive("/studio/resources") ? "bg-accent text-accent-foreground" : "text-slate-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <LayoutDashboard className="h-4 w-4 mr-3" />
                                Resources
                            </div>
                        </Link>
                        <Link
                            href="/studio/history"
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                                checkActive("/studio/history") ? "bg-accent text-accent-foreground" : "text-slate-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <History className="h-4 w-4 mr-3" />
                                History
                            </div>
                        </Link>
                        <Link
                            href="/studio/notifications"
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-200/50 rounded-lg transition mb-1",
                                checkActive("/studio/notifications") ? "bg-accent text-accent-foreground" : "text-slate-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <Bell className="h-4 w-4 mr-3" />
                                Notifications
                            </div>
                        </Link>
                    </div>

                </div>
            </div>

            {/* Logout Footer */}
            <div className="px-3 pb-2">
                <button
                    onClick={handleLogout}
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition"
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-4 w-4 mr-3" />
                        Log Out
                    </div>
                </button>
            </div>
        </div >
    );
}
