"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Resource {
    id: string;
    type: string;
    name: string;
    thumbnail: string;
    prompt: string | null;
}

interface ResourceSelectorProps {
    type: string;
    onSelect: (resource: Resource) => void;
    trigger: React.ReactNode;
    title?: string;
}

export function ResourceSelector({ type, onSelect, trigger, title }: ResourceSelectorProps) {
    const [open, setOpen] = useState(false);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            fetchResources();
        }
    }, [open, type]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/resources?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            } else {
                console.error("Failed to load resources, status:", res.status);
                setResources([]);
            }
        } catch (e) {
            console.error("Failed to load resources", e);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
                <div className="px-6 py-4 border-b bg-zinc-50">
                    <DialogTitle className="text-lg font-semibold">{title || `Select ${type.charAt(0).toUpperCase() + type.slice(1)}`}</DialogTitle>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 min-h-[400px]">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-white p-12">
                            <p className="font-medium text-zinc-600">No {type}s found in the database.</p>
                            <p className="text-sm mt-1">Add them in the Admin &gt; Resources section.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {resources.map((resource) => (
                                <div
                                    key={resource.id}
                                    className="group flex flex-col bg-white rounded-xl border overflow-hidden cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all h-[280px]"
                                    onClick={() => {
                                        onSelect(resource);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="relative flex-1 bg-zinc-100 overflow-hidden">
                                        {resource.thumbnail ? (
                                            <img
                                                src={resource.thumbnail}
                                                alt={resource.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs uppercase font-bold tracking-widest bg-zinc-50">
                                                No Image
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                                                <Check className="w-5 h-5 text-indigo-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t bg-white flex flex-col gap-1 shrink-0 h-[80px]">
                                        <div className="font-semibold text-sm text-zinc-800 line-clamp-1 truncate" title={resource.name}>
                                            {resource.name}
                                        </div>
                                        {resource.prompt && (
                                            <div className="text-[10px] text-zinc-500 line-clamp-2 leading-tight" title={resource.prompt}>
                                                {resource.prompt}
                                            </div>
                                        )}
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
