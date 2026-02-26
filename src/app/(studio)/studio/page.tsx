"use client";

import { useState, useEffect } from "react";
import { FolderIcon, RefreshCw, Trash2, Plus } from "lucide-react";
import { FolderTree } from "@/components/dashboard/folder-tree";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { NotificationMarquee } from "@/components/dashboard/NotificationMarquee";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

export default function StudioPage() {
    const { selectedFolder } = useStore();
    const [selectedFolderPath, setSelectedFolderPath] = useState(selectedFolder || "");
    const [assets, setAssets] = useState<FileEntry[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col gap-4 p-6 overflow-hidden bg-background">
            {/* Top Bar: Marquee */}
            <div className="shrink-0">
                <NotificationMarquee />
            </div>

            {/* Stats Row */}
            <div className="shrink-0">
                <StatsRow />
            </div>

            {/* Main Content: Folder Tree and Gallery */}
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

                        <Button variant="ghost" size="icon" onClick={fetchAssets} disabled={loadingAssets} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <RefreshCw className={cn("w-4 h-4", loadingAssets && "animate-spin")} />
                        </Button>
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
                                        onClick={() => setPreviewImage(`/api/filesystem/image?path=${encodeURIComponent(file.path)}`)}
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

            {/* Image Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent showCloseButton={false} className="max-w-[90vw] max-h-[90vh] p-1 bg-transparent border-none shadow-none flex items-center justify-center">
                    <DialogTitle className="sr-only">Image Preview</DialogTitle>
                    {previewImage && (
                        <div className="relative w-full h-[85vh]">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
