"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ScanFace, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelResource {
    id: string;
    name: string;
    thumbnail: string; // URL
}

interface ModelSelectorProps {
    onSelect: (modelUrl: string) => void;
    trigger?: React.ReactNode;
}

export function ModelSelector({ onSelect, trigger }: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [models, setModels] = useState<ModelResource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            fetchModels();
        }
    }, [open]);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/resources?type=model");
            if (res.ok) {
                const data = await res.json();
                setModels(data);
            }
        } catch (e) {
            console.error("Failed to load models", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <ScanFace className="h-4 w-4" /> Select Saved Model
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Saved Model</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : models.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <ScanFace className="h-12 w-12 mb-4 opacity-50" />
                            <p>No saved models found.</p>
                            <p className="text-sm">Generate one in Admin &gt; Models.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {models.map((model) => (
                                <div
                                    key={model.id}
                                    className="group relative aspect-[3/4] rounded-lg border bg-muted overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                                    onClick={() => {
                                        onSelect(model.thumbnail);
                                        setOpen(false);
                                    }}
                                >
                                    <img
                                        src={model.thumbnail}
                                        alt={model.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                        {model.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
