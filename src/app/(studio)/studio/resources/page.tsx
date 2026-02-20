"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

    const filteredResources = resources.filter(r =>
        (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.type.toLowerCase().includes(searchQuery.toLowerCase())) &&
        r.type !== "model" &&
        (activeCategory === "all" || r.type === activeCategory)
    );

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
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

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Button
                        variant={activeCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory("all")}
                        className="rounded-full"
                    >
                        All
                    </Button>
                    {categories.map(cat => (
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
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-10">
                    {filteredResources.map((resource) => (
                        <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            {resource.thumbnail && (
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                    <img
                                        src={resource.thumbnail}
                                        alt={resource.name}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                    />
                                </div>
                            )}
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="capitalize">
                                        {resource.type.replace("_", " ")}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg mt-2">{resource.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground font-mono break-words mb-2 line-clamp-3">
                                    {resource.prompt}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => copyPrompt(resource.prompt)}
                                >
                                    <Copy className="h-3 w-3" /> Copy Prompt
                                </Button>
                            </CardContent>
                        </Card>
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
