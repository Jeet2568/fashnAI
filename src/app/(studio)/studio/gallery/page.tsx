"use client";

import { useState, useEffect } from "react";
import { FolderIcon, Plus, Trash2, ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { FolderTree } from "@/components/dashboard/folder-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { useTryOnStore } from "../product-to-model/store";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
    mtimeMs?: number;
}

export default function StudioGalleryPage() {
    const { selectedFolder } = useTryOnStore();
    const [selectedFolderPath, setSelectedFolderPath] = useState(selectedFolder || "");
    const [assets, setAssets] = useState<FileEntry[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // File Operation State
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [clipboard, setClipboard] = useState<{ action: "copy" | "move", paths: string[] } | null>(null);

    // Sorting & Filtering State
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az">("newest");
    const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "reject">("all");

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
                    sourcePaths: [path]
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

    const handleToolbarAction = async (action: "move" | "copy" | "delete") => {
        if (selectedItems.size === 0) {
            toast.error(`Please select items to ${action}`);
            return;
        }

        if (action === "delete") {
            if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;
            try {
                const res = await fetch("/api/filesystem", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "delete",
                        sourcePaths: Array.from(selectedItems)
                    })
                });
                if (res.ok) {
                    toast.success("Items deleted");
                    setSelectedItems(new Set());
                    setIsSelectMode(false);
                    fetchAssets();
                } else toast.error("Failed to delete items");
            } catch { toast.error("Error deleting items"); }
        } else {
            setClipboard({ action, paths: Array.from(selectedItems) });
            setSelectedItems(new Set());
            setIsSelectMode(false);
            toast.success(`${selectedItems.size} items ready to ${action}. Navigate and Paste.`);
        }
    };

    const handleReject = async () => {
        if (selectedItems.size === 0) return toast.error("Please select items to reject.");
        if (!selectedFolderPath) return toast.error("No folder selected.");

        // Target path replaces concluding Results or RAW
        const destPath = selectedFolderPath.replace(/Results$/i, "Reject").replace(/RAW$/i, "Reject");

        if (destPath === selectedFolderPath) {
            return toast.error("Can only reject items directly from a Product's Results or RAW folder.");
        }

        try {
            // Ensure Reject folder exists
            await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create_folder", path: destPath })
            });

            // Move the files
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "move",
                    sourcePaths: Array.from(selectedItems),
                    destPath: destPath
                })
            });

            if (res.ok) {
                toast.success(`Moved ${selectedItems.size} items to Reject folder.`);
                setSelectedItems(new Set());
                setIsSelectMode(false);
                fetchAssets();
            } else {
                toast.error("Failed to reject items.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error moving items to Reject.");
        }
    };

    const handlePaste = async () => {
        if (!clipboard) return toast.error("Nothing to paste");
        try {
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: clipboard.action,
                    sourcePaths: clipboard.paths,
                    destPath: selectedFolderPath
                })
            });
            if (res.ok) {
                toast.success(`Items ${clipboard.action === 'move' ? 'moved' : 'copied'} successfully`);
                setClipboard(null);
                fetchAssets();
            } else toast.error("Paste failed");
        } catch { toast.error("Error pasting items"); }
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
                <div className="flex items-center gap-1 bg-background border rounded-md p-1 shadow-sm overflow-x-auto">
                    <Button
                        variant={isSelectMode ? "secondary" : "ghost"}
                        size="sm"
                        className={cn("h-8 px-3", isSelectMode && "bg-primary/20 text-primary hover:bg-primary/30")}
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            if (isSelectMode) setSelectedItems(new Set());
                        }}
                    >
                        Select {selectedItems.size > 0 && `(${selectedItems.size})`}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleToolbarAction("move")}>Move</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleToolbarAction("copy")}>Copy</Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                        onClick={handleReject}
                    >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 relative"
                        onClick={handlePaste}
                        disabled={!clipboard}
                    >
                        Paste
                        {clipboard && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => handleToolbarAction("delete")}>Delete</Button>

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
                            {(() => {
                                const filteredAssets = assets
                                    .filter(a => !a.isDirectory)
                                    .filter(a => {
                                        if (statusFilter === "all") return true;
                                        const isReject = a.path.toLowerCase().includes("reject");
                                        if (statusFilter === "reject") return isReject;
                                        if (statusFilter === "ok") return !isReject;
                                        return true;
                                    })
                                    .sort((a, b) => {
                                        if (sortOrder === "az") return a.name.localeCompare(b.name);
                                        const timeA = a.mtimeMs || 0;
                                        const timeB = b.mtimeMs || 0;
                                        if (sortOrder === "newest") return timeB - timeA;
                                        if (sortOrder === "oldest") return timeA - timeB;
                                        return 0;
                                    });

                                return (
                                    <>
                                        {filteredAssets.length} images in current view
                                    </>
                                );
                            })()}
                        </span>

                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                                <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="ok">OK (No Reject)</SelectItem>
                                    <SelectItem value="reject">Reject Only</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
                                <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="az">Name A-Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {(() => {
                            const filteredAssets = assets
                                .filter(a => !a.isDirectory)
                                .filter(a => {
                                    if (statusFilter === "all") return true;
                                    const isReject = a.path.toLowerCase().includes("reject");
                                    if (statusFilter === "reject") return isReject;
                                    if (statusFilter === "ok") return !isReject;
                                    return true;
                                })
                                .sort((a, b) => {
                                    if (sortOrder === "az") return a.name.localeCompare(b.name);
                                    const timeA = a.mtimeMs || 0;
                                    const timeB = b.mtimeMs || 0;
                                    if (sortOrder === "newest") return timeB - timeA;
                                    if (sortOrder === "oldest") return timeA - timeB;
                                    return 0;
                                });

                            if (loadingAssets) {
                                return (
                                    <div className="h-full flex items-center justify-center p-8">
                                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                                            <RefreshCw className="w-4 h-4 animate-spin" /> Loading assets...
                                        </span>
                                    </div>
                                );
                            }

                            if (filteredAssets.length === 0) {
                                return (
                                    <div className="h-full flex items-center justify-center p-8 text-muted-foreground text-sm">
                                        No images matched your filters.
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {filteredAssets.map((file, i) => {
                                        const isSelected = selectedItems.has(file.path);
                                        return (
                                            <div
                                                key={file.path}
                                                className={cn(
                                                    "group relative aspect-[3/4] bg-muted rounded-md overflow-hidden border transition-all cursor-pointer shadow-sm",
                                                    isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "hover:border-primary/50"
                                                )}
                                                onClick={() => {
                                                    if (isSelectMode) {
                                                        const newSet = new Set(selectedItems);
                                                        if (newSet.has(file.path)) newSet.delete(file.path);
                                                        else newSet.add(file.path);
                                                        setSelectedItems(newSet);
                                                    } else {
                                                        window.open(`/api/filesystem/image?path=${encodeURIComponent(file.path)}`, '_blank');
                                                    }
                                                }}
                                            >
                                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
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
                                                {isSelectMode && (
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors",
                                                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-white bg-black/20"
                                                        )}>
                                                            {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                                                    <p className="text-xs text-white truncate w-full">{file.name}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
