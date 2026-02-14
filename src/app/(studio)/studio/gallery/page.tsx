"use client";

import { useState } from "react";
import { FileExplorer } from "@/components/file-explorer";
import { useTryOnStore } from "../product-to-model/store";
import { ImageViewerDialog } from "@/components/image-viewer-dialog";

export default function StudioGalleryPage() {
    const { selectedFolder } = useTryOnStore();
    const [viewerPath, setViewerPath] = useState<string | null>(null);

    const handleSelectFile = (file: any) => {
        if (!file.isDirectory) {
            setViewerPath(file.path);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
                <div>
                    <h1 className="text-xl font-bold">Gallery</h1>
                    <p className="text-xs text-muted-foreground">
                        Browsing: <span className="font-mono bg-zinc-100 px-1 rounded text-zinc-700">{selectedFolder || "Root"}</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6 bg-zinc-50/50">
                <FileExplorer
                    initialPath={selectedFolder || ""}
                    onSelectFolder={() => { }}
                    onSelectFile={handleSelectFile}
                    defaultView="grid"
                    className="h-full border shadow-sm bg-white"
                />
            </div>

            <ImageViewerDialog
                path={viewerPath || ""}
                isOpen={!!viewerPath}
                onClose={() => setViewerPath(null)}
            />
        </div>
    );
}
