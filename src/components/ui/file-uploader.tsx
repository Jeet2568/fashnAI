"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploaderProps {
    value?: string;
    onValueChange: (url: string) => void;
    folder?: string;
    className?: string;
    label?: string;
}

export function FileUploader({
    value,
    onValueChange,
    folder = "_uploads",
    className,
    label = "Upload Image"
}: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        try {
            const res = await fetch("/api/filesystem/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            onValueChange(data.url);
            toast.success("Image uploaded");
        } catch (error) {
            toast.error("Failed to upload image");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange("");
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-lg transition-colors overflow-hidden group h-40 flex flex-col items-center justify-center cursor-pointer",
                    value ? "border-transparent" : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/50 hover:bg-muted"
                )}
                onClick={() => !value && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : null}

                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={handleClear}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-4 space-y-2">
                        <div className="bg-background rounded-full p-2 w-fit mx-auto border shadow-sm">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            {label}
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                            Click to browse
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
