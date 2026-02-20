"use client";

import { useState, useEffect } from "react";
import { FolderIcon, Plus, Trash2, ArrowLeft, RefreshCw } from "lucide-react";
import { FolderTree } from "@/components/dashboard/folder-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

export default function AdminGalleryPage() {
    const [selectedFolderPath, setSelectedFolderPath] = useState("CodeVeda AI/02-2026/16-02-2026/01_TestClient/01_TestProduct");
    const [assets, setAssets] = useState<FileEntry[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const fetchAssets = async () => {
        setLoadingAssets(true);
        try {
            const res = await fetch(`/api/filesystem?path=${encodeURIComponent(selectedFolderPath)}`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data.files);
            }
        } catch (error) {
            console.error("Failed to load assets", error);
        } finally {
            setLoadingAssets(false);
        }
    };

    useEffect(() => {
        if (!selectedFolderPath) return;
        fetchAssets();
    }, [selectedFolderPath]);

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        try {
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create_folder",
                    path: `${selectedFolderPath}/${newFolderName}`
                })
            });

            if (res.ok) {
                toast.success("Folder created");
                setNewFolderName("");
                setIsCreateDialogOpen(false);
                fetchAssets(); // Refresh
            } else {
                toast.error("Failed to create folder");
            }
        } catch (error) {
            toast.error("Error creating folder");
        }
    };

    const handleDelete = async (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete",
                    path: path
                })
            });

            if (res.ok) {
                toast.success("Item deleted");
                fetchAssets();
            } else {
                toast.error("Failed to delete item");
            }
        } catch (error) {
            toast.error("Error deleting item");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] p-6 space-y-4">
            {/* Top Bar: Breadcrumbs & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">

                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2">
                    {!selectedFolderPath ? (
                        <Button variant="outline" className="h-9">
                            Root Directory
                        </Button>
                    ) : (
                        selectedFolderPath.split(/[\\/]/).map((part, i, arr) => (
                            <Button
                                key={i}
                                variant="outline"
                                onClick={() => {
                                    const newPath = arr.slice(0, i + 1).join("/");
                                    setSelectedFolderPath(newPath);
                                }}
                                className={cn(
                                    "h-9",
                                    i === arr.length - 1 ? "font-bold pointer-events-none" : "font-medium text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {i === 0 && part === "CodeVeda AI" ? "Root Directory" : part}
                            </Button>
                        ))
                    )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-1 bg-background border rounded-md p-1 shadow-sm">
                    <Button variant="ghost" size="sm" className="h-8 px-3">Select</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3">Move</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3">Copy</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3">Paste</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">Delete</Button>

                    <div className="w-px h-4 bg-border mx-1" />

                    <Button variant="ghost" size="icon" onClick={fetchAssets} disabled={loadingAssets} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <RefreshCw className={cn("w-4 h-4", loadingAssets && "animate-spin")} />
                    </Button>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-primary hover:text-primary hover:bg-primary/10">
                                <Plus className="w-4 h-4 mr-1" /> New
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Folder</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="Folder Name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateFolder}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Split Layout Area */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

                {/* Left: Folder Tree Explorer */}
                <Card className="w-1/3 min-w-[250px] max-w-[350px] flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-muted/20">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                            <FolderIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                            File Explorer
                        </h3>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                        <FolderTree
                            path=""
                            onSelect={setSelectedFolderPath}
                            selectedPath={selectedFolderPath}
                        />
                    </ScrollArea>
                </Card>

                {/* Right: Content Grid */}
                <Card className="flex-1 flex flex-col overflow-hidden shadow-sm bg-muted/10">
                    <div className="p-4 border-b flex items-center justify-between bg-background/50">
                        <span className="text-sm font-medium text-muted-foreground flex items-center">
                            {assets.filter(a => !a.isDirectory).length} images in current folder
                        </span>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {loadingAssets ? (
                            <div className="h-full flex items-center justify-center p-8">
                                <span className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading assets...
                                </span>
                            </div>
                        ) : assets.filter(a => !a.isDirectory).length === 0 ? (
                            <div className="h-full flex items-center justify-center p-8 text-muted-foreground text-sm">
                                This folder has no images.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {assets.filter(a => !a.isDirectory).map((file, i) => (
                                    <div
                                        key={file.path}
                                        className="group relative aspect-[3/4] bg-muted rounded-md overflow-hidden border hover:border-primary transition-all cursor-pointer shadow-sm"
                                        onClick={() => window.open(`/api/filesystem/image?path=${encodeURIComponent(file.path)}`, '_blank')}
                                    >
                                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="destructive" size="icon" className="h-6 w-6" onClick={(e) => handleDelete(file.path, e)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <Image
                                            src={`/api/filesystem/image?path=${encodeURIComponent(file.path)}`}
                                            alt={file.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                                            <p className="text-xs text-white truncate w-full">{file.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
