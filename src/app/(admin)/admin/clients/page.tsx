"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { UserCircle, Plus, Folder, Loader2, ArrowLeft, LayoutList, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

function ClientListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPath = searchParams.get("path") || "";
    const isBrowserMode = searchParams.get("mode") === "browser"; // Default to List
    const { setSelectedFolder } = useStore();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Fetch Logic
    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isBrowserMode) {
                // Browser Mode: Use regular filesystem API
                const res = await fetch(`/api/filesystem?path=${encodeURIComponent(currentPath)}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.files.filter((f: any) => f.isDirectory));
                } else {
                    setError(`Failed to load: ${res.status} ${res.statusText}`);
                }
            } else {
                // List Mode: Scan for clients deep in structure
                // Root is fixed to Studio AI for now, or we can scan from root?
                // User said "Studio AI is organisation". So clients are INSIDE it.
                // Structure: Studio AI (0) -> Month (1) -> Date (2) -> Client (3)
                // So we want depth 3 from "CodeVeda AI".
                const res = await fetch(`/api/filesystem/scan?root=CodeVeda%20AI&depth=3`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.files || []);
                } else {
                    setError("Failed to scan for clients.");
                }
            }
        } catch (error) {
            setError("Network error loading folders");
            toast.error("Failed to load folders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentPath, isBrowserMode]);

    const handleCreateFolder = async () => {
        if (!newItemName) return;
        setCreating(true);
        try {
            // Ideally create in specific date folder?
            // If in List Mode, WHERE do we create?
            // Maybe just default to: Studio AI / CurrentMonth / Today / NewClient?
            // For now, let's create in Root (Studio AI) if in list mode? No, that breaks structure.
            // Let's create in "CodeVeda AI" root if list mode, or current path if browser.
            // Actually, user probably wants to create in TODAY'S folder.

            let targetPath = currentPath;
            if (!isBrowserMode) {
                // Auto-generate path: CodeVeda AI/MM-YYYY/DD-MM-YYYY/ClientName
                const now = new Date();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                const day = String(now.getDate()).padStart(2, '0');
                targetPath = `CodeVeda AI/${month}-${year}/${day}-${month}-${year}`;
            }

            const fullPath = targetPath ? `${targetPath}/${newItemName}` : newItemName;

            const res = await fetch("/api/filesystem/mkdir", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: fullPath })
            });

            if (!res.ok) throw new Error("Failed to create folder");

            toast.success(`Client "${newItemName}" created in ${targetPath || "root"}`);
            setNewItemName("");
            setIsDialogOpen(false);
            fetchItems();
        } catch (error) {
            toast.error("Failed to create folder");
        } finally {
            setCreating(false);
        }
    };

    const handleFolderClick = (item: any) => {
        if (isBrowserMode) {
            // Drill down
            const nextPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            router.push(`/admin/clients?mode=browser&path=${encodeURIComponent(nextPath)}`);
        } else {
            // Flat List Item Click -> Go to Product List for this Client
            // Item path from scan is relative to NAS_ROOT? 
            // Scan returns relative path from NAS_ROOT.
            // So item.path is exactly what we need for Product List.
            // Wait, implementation of Scan returns path relative to base?
            // Let's check Scan implementation.
            // It returns `path.relative(basePath, fullChildPath)`.
            // basePath is NAS_ROOT. So it returns `CodeVeda AI/02-2026/.../Client`.
            // Perfect.
            router.push(`/admin/products?client=${encodeURIComponent(item.path)}`);
        }
    };

    const handleBack = () => {
        if (!currentPath) return;
        const parent = currentPath.split("/").slice(0, -1).join("/");
        router.push(`/admin/clients?mode=browser&path=${encodeURIComponent(parent)}`);
    };

    const toggleMode = () => {
        if (isBrowserMode) {
            router.push("/admin/clients"); // Default to list
        } else {
            router.push("/admin/clients?mode=browser&path=CodeVeda%20AI"); // Start browser at Org
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                {isBrowserMode && currentPath && (
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isBrowserMode ? "File Browser" : "Clients"}
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm">
                        {isBrowserMode ? (currentPath || "Root") : "Direct List"}
                    </p>
                </div>

                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="icon" onClick={toggleMode} title={isBrowserMode ? "Switch to List View" : "Switch to Browser View"}>
                        {isBrowserMode ? <LayoutList className="h-4 w-4" /> : <FolderTree className="h-4 w-4" />}
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle className="sr-only">Add New Client</DialogTitle>
                            <DialogHeader>
                                <DialogTitle>Add New Client</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="Client Name"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                />
                                {!isBrowserMode && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Client will be created in today's date folder.
                                    </p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateFolder} disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="text-center p-8 text-red-500 border rounded-lg border-dashed border-red-200 bg-red-50">
                    <p className="font-semibold">Error loading items</p>
                    <p className="text-sm">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={fetchItems}>Retry</Button>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                    No clients found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Card
                            key={item.path || item.name}
                            className="cursor-pointer hover:bg-accent transition-colors relative group"
                            onClick={() => handleFolderClick(item)}
                        >
                            <CardContent className="flex items-center p-6 gap-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    {isBrowserMode ? <Folder className="h-6 w-6 text-primary" /> : <UserCircle className="h-6 w-6 text-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{item.name}</div>
                                    {!isBrowserMode && (
                                        <div className="text-xs text-muted-foreground truncate">{item.parent}</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ClientListPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ClientListContent />
        </Suspense>
    );
}
