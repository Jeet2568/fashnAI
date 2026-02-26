"use client";

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Download, X, Info, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ImageViewerDialogProps {
    path: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageViewerDialog({ path, isOpen, onClose }: ImageViewerDialogProps) {
    const router = useRouter();
    const [showInfo, setShowInfo] = useState(false);

    if (!path) return null;

    const imageUrl = `/api/filesystem/image?path=${encodeURIComponent(path)}`;
    const filename = path.split(/[/\\]/).pop();

    const handleEdit = () => {
        onClose();
        router.push(`/studio/edit?image=${encodeURIComponent(path)}`);
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename || "image.png";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="max-w-[90vw] h-[90vh] p-0 border-none bg-black/95 text-white flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">Image Viewer</DialogTitle>
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white" onClick={handleDownload} title="Download">
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white" onClick={handleEdit} title="Edit in Studio">
                        <Edit className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white" onClick={onClose} title="Close">
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Filename Badge */}
                <div className="absolute top-4 left-4 z-50 bg-black/50 px-3 py-1 rounded-full text-sm font-mono backdrop-blur-md">
                    {filename}
                </div>

                {/* Main Image */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img
                        src={imageUrl}
                        alt={filename}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
