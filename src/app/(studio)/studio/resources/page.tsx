"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Copy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Resource {
    id: string;
    type: string;
    name: string;
    prompt: string;
    thumbnail?: string;
}


export default function UserResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchResources();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/resource-categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data.map((c: any) => c.value));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/resources");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setResources(data);
        } catch (error) {
            toast.error("Failed to load resources");
        } finally {
            setLoading(false);
        }
    };

    const copyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        toast.success("Prompt copied to clipboard");
    };

    const mainCategories = categories.filter(c => !["earrings", "necklace", "bracelet", "rings", "shoes", "watch", "handbag"].includes(c));
    const accessoryCategories = categories.filter(c => ["earrings", "necklace", "bracelet", "rings", "shoes", "watch", "handbag"].includes(c));

    const filteredResources = resources.filter(r =>
        (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.type.toLowerCase().includes(searchQuery.toLowerCase())) &&
        r.type !== "model" &&
        (activeCategory === "all" || r.type === activeCategory)
    );

    return (
        <div className="p-6 space-y-6 h-full flex flex-col max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Studio Resources</h1>
                    <p className="text-muted-foreground">
                        Browse available prompts and presets for your generations.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search for poses, lighting, accessories..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category Pills & Accessories Dropdown */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Button
                        variant={activeCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory("all")}
                        className="rounded-full"
                    >
                        All
                    </Button>
                    {mainCategories.map(cat => (
                        <Button
                            key={cat}
                            variant={activeCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(cat)}
                            className="rounded-full capitalize whitespace-nowrap"
                        >
                            {cat.replace(/_/g, " ")}
                        </Button>
                    ))}

                    {accessoryCategories.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("rounded-full capitalize whitespace-nowrap", accessoryCategories.includes(activeCategory) && "bg-primary text-primary-foreground hover:bg-primary/90")}
                                >
                                    {accessoryCategories.includes(activeCategory) ? activeCategory.replace(/_/g, " ") : "Accessories"}
                                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[160px]">
                                {accessoryCategories.map(cat => (
                                    <DropdownMenuItem
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn("cursor-pointer capitalize", activeCategory === cat && "bg-zinc-100 font-medium")}
                                    >
                                        {cat.replace(/_/g, " ")}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto pb-10 pr-2">
                    {filteredResources.map((resource) => (
                        <div
                            key={resource.id}
                            className="bg-white flex flex-col sm:flex-row rounded-2xl border shadow-sm overflow-hidden group p-4 gap-6 shrink-0"
                        >
                            {/* Left: Thumbnail container */}
                            <div className="aspect-square w-full sm:w-48 lg:w-56 bg-muted/20 relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden border">
                                {resource.thumbnail ? (
                                    <img
                                        src={resource.thumbnail}
                                        alt={resource.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50 text-sm">
                                        No Image
                                    </div>
                                )}
                            </div>

                            {/* Right: Details container */}
                            <div className="flex flex-col flex-1 py-1 gap-4 min-w-0">
                                <div className="text-[14px]">
                                    <span className="text-muted-foreground">Category:</span>
                                    <span className="capitalize text-foreground font-semibold ml-1.5">{resource.type.replace("_", " ")}</span>
                                </div>

                                <div className="border rounded-lg px-4 py-2 text-[14px] font-medium text-foreground w-fit bg-white">
                                    {resource.name}
                                </div>

                                <div className="border rounded-xl p-5 bg-white flex-1 relative mt-1 min-h-[120px]">
                                    <div className="text-[13px] text-muted-foreground font-mono leading-relaxed break-words pr-10">
                                        {resource.prompt}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground transition-all"
                                        onClick={() => copyPrompt(resource.prompt)}
                                        title="Copy Prompt"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredResources.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No resources found fitting your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
