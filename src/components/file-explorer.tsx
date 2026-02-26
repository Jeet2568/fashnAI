"use client";

import { useState, useEffect } from "react";
import { Folder, File, ChevronLeft, Loader2, Image as ImageIcon, LayoutList, LayoutGrid, Plus, Trash2, Copy, Scissors, ClipboardPaste, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

import { FolderTree } from "@/components/dashboard/folder-tree";

interface FileExplorerProps {
    onSelectFolder: (path: string) => void;
    onSelectFile?: (file: FileEntry) => void;
    onSelectFiles?: (files: FileEntry[]) => void;
    allowMultiSelect?: boolean;
    initialPath?: string;
    rootPath?: string; // If set, breadcrumbs start from here
    className?: string;
    defaultView?: "list" | "grid";
    variant?: "default" | "split";
    syncStore?: boolean;
    folderCardSize?: "small" | "large";
    allowCRUD?: boolean;
}

export function FileExplorer({
    onSelectFolder,
    onSelectFile,
    onSelectFiles,
    allowMultiSelect,
    initialPath = "",
    rootPath = "",
    className,
    defaultView = "list",
    variant = "default",
    syncStore = true,
    folderCardSize = "small",
    allowCRUD = false
}: FileExplorerProps) {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">(defaultView);

    // Multi-select state
    const [selectedFiles, setSelectedFiles] = useState<FileEntry[]>([]);

    // CRUD state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [clipboard, setClipboard] = useState<{ action: "copy" | "move", paths: string[] } | null>(null);

    // Global Store Sync
    const { setSelectedFolder } = useStore();
    useEffect(() => {
        if (syncStore) {
            setSelectedFolder(currentPath);
        }
    }, [currentPath, setSelectedFolder, syncStore]);

    // Respect initialPath prop changes
    useEffect(() => {
        if (initialPath !== undefined && initialPath !== currentPath) {
            setCurrentPath(initialPath);
            fetchFiles(initialPath);
        }
    }, [initialPath]);

    const fetchFiles = async (path: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/filesystem?path=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error("Failed to load directory");
            const data = await res.json();
            setFiles(data.files);
            setCurrentPath(data.path);
        } catch (error) {
            toast.error("Error loading files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(initialPath);
    }, []);

    const handleNavigate = (path: string) => {
        fetchFiles(path);
        // Clear selection on navigate? Or keep it? keeping it might be confusing if across folders.
        // Let's clear for simplicity.
        setSelectedFiles([]);
    };

    const handleUp = () => {
        if (!currentPath) return;
        const parent = currentPath.split("/").slice(0, -1).join("/");
        handleNavigate(parent);
    };

    const toggleSelection = (file: FileEntry) => {
        setSelectedFiles(prev => {
            const exists = prev.find(f => f.path === file.path);
            if (exists) return prev.filter(f => f.path !== file.path);
            return [...prev, file];
        });
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        try {
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create_folder",
                    path: `${currentPath}/${newFolderName}`
                })
            });

            if (res.ok) {
                toast.success("Folder created");
                setNewFolderName("");
                setIsCreateDialogOpen(false);
                fetchFiles(currentPath);
            } else {
                toast.error("Failed to create folder");
            }
        } catch (error) {
            toast.error("Error creating folder");
        }
    };

    const handleDelete = async (paths: string[]) => {
        if (!confirm(`Are you sure you want to delete ${paths.length} item(s)?`)) return;
        try {
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", sourcePaths: paths })
            });
            if (res.ok) {
                toast.success("Deleted successfully");
                setSelectedFiles([]);
                fetchFiles(currentPath);
            } else toast.error("Delete failed");
        } catch { toast.error("Error deleting items"); }
    };

    const handleCopyMove = (action: "copy" | "move") => {
        if (selectedFiles.length === 0) return toast.error("Select items first");
        setClipboard({ action, paths: selectedFiles.map(f => f.path) });
        setSelectedFiles([]);
        toast.info(`${selectedFiles.length} items ${action === 'move' ? 'cut' : 'copied'}`);
    };

    const handlePaste = async () => {
        if (!clipboard) return;
        try {
            const res = await fetch("/api/filesystem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: clipboard.action,
                    sourcePaths: clipboard.paths,
                    destPath: currentPath
                })
            });
            if (res.ok) {
                toast.success("Pasted successfully");
                setClipboard(null);
                fetchFiles(currentPath);
            } else toast.error("Paste failed");
        } catch { toast.error("Error pasting items"); }
    };

    const MainContent = (
        <div className={cn("flex flex-col rounded-md border bg-card text-card-foreground overflow-hidden", variant === "default" && "h-[500px]", className)}>
            <div className="flex items-center gap-2 border-b p-2 bg-muted/50 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleUp} disabled={!currentPath} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleNavigate(rootPath)}
                    >
                        {rootPath ? (rootPath.split('/').pop() || "Root") : "Root"}
                    </Button>
                    {currentPath && currentPath.split("/").map((part, i, arr) => {
                        const segmentPath = arr.slice(0, i + 1).join("/");
                        if (rootPath && !segmentPath.startsWith(rootPath)) return null;
                        if (rootPath && segmentPath === rootPath) return null;

                        return (
                            <div key={i} className="flex items-center gap-1">
                                <span className="text-muted-foreground/50 text-xs">/</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-xs font-medium truncate max-w-[120px]",
                                        i === arr.length - 1 ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => handleNavigate(segmentPath)}
                                >
                                    {part}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {allowCRUD && (
                    <div className="flex items-center gap-1 border-l pl-2 mr-2">
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50">
                                    <Plus className="h-4 w-4" />
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
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateFolder}>Create</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => handleCopyMove("copy")}
                            disabled={selectedFiles.length === 0}
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => handleCopyMove("move")}
                            disabled={selectedFiles.length === 0}
                        >
                            <Scissors className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground relative"
                            onClick={handlePaste}
                            disabled={!clipboard}
                        >
                            <ClipboardPaste className="h-3.5 w-3.5" />
                            {clipboard && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(selectedFiles.map(f => f.path))}
                            disabled={selectedFiles.length === 0}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => fetchFiles(currentPath)}>
                            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        </Button>
                    </div>
                )}
                <div className="flex items-center gap-1 border-l pl-2 mr-2">
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setViewMode("list")}
                    >
                        <LayoutList className="h-3 w-3" />
                    </Button>
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="h-3 w-3" />
                    </Button>
                </div>

                {allowMultiSelect ? (
                    <Button size="sm" onClick={() => onSelectFiles?.(selectedFiles)} disabled={selectedFiles.length === 0}>
                        Confirm ({selectedFiles.length})
                    </Button>
                ) : (
                    <Button size="sm" onClick={() => onSelectFolder(currentPath)}>
                        Select Current Folder
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-background/50">
                <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center p-4 text-sm text-muted-foreground">
                            Empty Directory
                        </div>
                    ) : viewMode === "list" ? (
                        // LIST VIEW
                        files.map((file) => {
                            const isSelected = selectedFiles.some(f => f.path === file.path);
                            return (
                                <div
                                    key={file.path}
                                    className={cn(
                                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                        isSelected ? "bg-indigo-100 text-indigo-900" : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    onClick={() => {
                                        if (file.isDirectory) {
                                            handleNavigate(file.path);
                                        } else {
                                            if (allowMultiSelect) {
                                                toggleSelection(file);
                                            } else {
                                                onSelectFile?.(file);
                                            }
                                        }
                                    }}
                                >
                                    {file.isDirectory ? (
                                        <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                                    ) : (
                                        <ImageIcon className={cn("h-4 w-4", isSelected ? "text-indigo-600" : "text-yellow-500")} />
                                    )}
                                    <span className="truncate flex-1">{file.name}</span>
                                    {allowMultiSelect && !file.isDirectory && isSelected && (
                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        // GRID VIEW
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-2">
                            {files.map((file) => {
                                const isSelected = selectedFiles.some(f => f.path === file.path);

                                if (file.isDirectory) {
                                    if (folderCardSize === "large") {
                                        return (
                                            <div
                                                key={file.path}
                                                className="col-span-1 border rounded-lg overflow-hidden bg-background hover:bg-muted/50 transition-all cursor-pointer group shadow-sm border-dashed"
                                                onClick={() => handleNavigate(file.path)}
                                            >
                                                <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                                                    <div className="bg-primary/10 p-5 rounded-full group-hover:bg-primary/20 transition-colors">
                                                        <Folder className="h-10 w-10 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-base">{file.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1 text-center">Click to open</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={file.path}
                                            className={cn(
                                                "aspect-square rounded-lg border flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:shadow-md relative group bg-white",
                                                isSelected ? "ring-2 ring-indigo-500 bg-indigo-50" : "hover:border-zinc-300"
                                            )}
                                            onClick={() => handleNavigate(file.path)}
                                        >
                                            <Folder className="h-12 w-12 text-blue-500 fill-blue-500/20 mb-2" />
                                            <span className="text-xs text-center font-medium truncate w-full px-1">{file.name}</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={file.path}
                                        className={cn(
                                            "aspect-square rounded-lg border flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:shadow-md relative group bg-white",
                                            isSelected ? "ring-2 ring-indigo-500 bg-indigo-50" : "hover:border-zinc-300"
                                        )}
                                        onClick={() => {
                                            if (allowMultiSelect) {
                                                toggleSelection(file);
                                            } else {
                                                onSelectFile?.(file);
                                            }
                                        }}
                                    >
                                        <img
                                            src={`/api/filesystem/image?path=${encodeURIComponent(file.path)}`}
                                            alt={file.name}
                                            className="w-full h-full object-cover rounded absolute inset-0 z-0 opacity-90 group-hover:opacity-100 transition-opacity"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 backdrop-blur-sm rounded-b opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <span className="text-[10px] text-white truncate w-full block text-center">{file.name}</span>
                                        </div>

                                        {allowMultiSelect && isSelected && (
                                            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-indigo-500 border-2 border-white z-20 shadow-sm" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (variant === "split") {
        return (
            <div className={cn("flex h-full gap-4", className)}>
                {/* Left: Folder Tree */}
                <div className="w-1/4 min-w-[250px] border rounded-lg bg-card overflow-hidden flex flex-col">
                    <div className="p-3 border-b bg-muted/30 font-semibold text-sm">
                        Folder Structure
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <FolderTree
                            path=""
                            onSelect={(path) => handleNavigate(path)}
                            selectedPath={currentPath}
                        />
                    </div>
                </div>

                {/* Right: Main Content (Grid/List) */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {MainContent}
                </div>
            </div>
        );
    }

    return MainContent;
}
