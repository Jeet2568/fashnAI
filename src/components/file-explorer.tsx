"use client";

import { useState, useEffect } from "react";
import { Folder, File, ChevronLeft, Loader2, Image as ImageIcon, LayoutList, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface FileExplorerProps {
    onSelectFolder: (path: string) => void;
    onSelectFile?: (file: FileEntry) => void;
    onSelectFiles?: (files: FileEntry[]) => void;
    allowMultiSelect?: boolean;
    initialPath?: string;
    className?: string;
    defaultView?: "list" | "grid";
}

export function FileExplorer({ onSelectFolder, onSelectFile, onSelectFiles, allowMultiSelect, initialPath = "", className, defaultView = "list" }: FileExplorerProps) {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">(defaultView);

    // Multi-select state
    const [selectedFiles, setSelectedFiles] = useState<FileEntry[]>([]);

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
        fetchFiles(currentPath);
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

    return (
        <div className={cn("flex h-[500px] flex-col rounded-md border bg-card text-card-foreground", className)}>
            <div className="flex items-center gap-2 border-b p-2 bg-muted/50">
                <Button variant="ghost" size="icon" onClick={handleUp} disabled={!currentPath}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 truncate text-sm font-medium font-mono">
                    {currentPath || "Root"}
                </div>
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

            <ScrollArea className="flex-1">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                            {files.map((file) => {
                                const isSelected = selectedFiles.some(f => f.path === file.path);
                                return (
                                    <div
                                        key={file.path}
                                        className={cn(
                                            "aspect-square rounded-lg border flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:shadow-md relative group bg-white",
                                            isSelected ? "ring-2 ring-indigo-500 bg-indigo-50" : "hover:border-zinc-300"
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
                                            <>
                                                <Folder className="h-12 w-12 text-blue-500 fill-blue-500/20 mb-2" />
                                                <span className="text-xs text-center font-medium truncate w-full px-1">{file.name}</span>
                                            </>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
