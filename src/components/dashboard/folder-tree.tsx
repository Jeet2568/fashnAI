"use client";

import { useState, useEffect } from "react";
import { FolderIcon, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface FolderTreeProps {
    path?: string;
    level?: number;
    onSelect: (path: string) => void;
    selectedPath: string;
}

export function FolderTree({ path = "", level = 0, onSelect, selectedPath }: FolderTreeProps) {
    const [folders, setFolders] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);
    // Normalize paths for comparison (handle Windows backslashes)
    const normalizedPath = path.replace(/\\/g, "/");
    const normalizedSelected = selectedPath.replace(/\\/g, "/");
    const [isOpen, setIsOpen] = useState(level === 0 || (normalizedSelected.startsWith(normalizedPath) && normalizedPath !== ""));

    // Fetch folders on mount or when expanded
    const fetchFolders = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/filesystem?path=${encodeURIComponent(path)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter only directories
                const dirs = data.files.filter((f: any) => f.isDirectory);
                setFolders(dirs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFolders();
        }
    }, [isOpen, path]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(path);
        setIsOpen(true);
    };

    // Root container
    if (level === 0 && !path) {
        return (
            <div className="pl-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin mb-2" />}
                {folders.map((folder) => (
                    <FolderTree
                        key={folder.path}
                        path={folder.path}
                        level={level + 1}
                        onSelect={onSelect}
                        selectedPath={selectedPath}
                    />
                ))}
            </div>
        );
    }

    const isSelected = selectedPath === path;
    const folderName = path.split(/[\\/]/).pop();

    return (
        <div className="select-none text-sm">
            <div
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                    isSelected && "bg-primary/10 text-primary font-medium"
                )}
                onClick={handleSelect}
            >
                <button
                    onClick={toggleOpen}
                    className="p-0.5 hover:bg-muted rounded text-muted-foreground/70"
                >
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <FolderIcon className={cn("w-4 h-4 text-blue-400 shrink-0", isSelected && "text-blue-500")} />
                <span className="truncate">{folderName}</span>
            </div>

            {isOpen && (
                <div className="ml-2 pl-2 border-l border-border/50">
                    {loading ? (
                        <div className="pl-4 py-1 text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </div>
                    ) : (
                        folders.map((folder) => (
                            <FolderTree
                                key={folder.path}
                                path={folder.path}
                                level={level + 1}
                                onSelect={onSelect}
                                selectedPath={selectedPath}
                            />
                        ))
                    )}
                    {!loading && folders.length === 0 && (
                        <div className="pl-6 py-1 text-xs text-muted-foreground italic">Empty</div>
                    )}
                </div>
            )}
        </div>
    );
}
