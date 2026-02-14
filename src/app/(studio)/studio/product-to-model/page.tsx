"use client";

import { useState } from "react";
import {
    PanelRightClose,
    PanelRightOpen,
    Play,
    ScanFace,
    Sparkles,
    Image as ImageIcon,
    MoreHorizontal,
    Loader2,
    Undo2,
    RefreshCw,
    Upload,
    Palette,
    Layers,
    XCircle,
    Plus,
    Camera,
    LayoutGrid,
    Shirt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { useTryOnStore, FileEntry } from "./store";
import { toast } from "sonner";
import { FileExplorer } from "@/components/file-explorer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runMakeItMore } from "./actions";
import { useRouter } from "next/navigation";


export default function ProductToModelPage() {
    // Store
    const {
        prompt, aspectRatio, numImages,
        useFaceReference, useImagePrompt,
        category, garmentPhotoType,
        creativity, resemblance, structureMatch,
        selectedModel, selectedGarments, selectedBackground,
        setParam, setModel, setGarments, setBackground, setFolder, selectedFolder,
        quality
    } = useTryOnStore();

    // Local
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isThinking, setIsThinking] = useState(false);

    // ... inside component ...

    const router = useRouter();

    // Real Generation
    const handleRun = async () => {
        // Validation: Need at least a garment. Model is now optional (Product-to-Model fallback).
        if (selectedGarments.length === 0) {
            toast.error("Please select at least one Garment.");
            return;
        }

        setIsThinking(true);
        if (selectedModel) {
            toast.info("Sending Try-On job...");
        } else {
            toast.info("Generating model from product...");
        }

        try {
            // Default category map or inference
            const categoryMap: Record<string, "tops" | "bottoms" | "one-pieces"> = {
                "top": "tops",
                "bottom": "bottoms",
                "dress": "one-pieces",
                "outerwear": "tops" // approx
            };

            // Just take the first garment for now (Multi-garment is advanced)
            const garment = selectedGarments[0];
            // Infer category from path or metadata if available, else default to 'tops'
            // For now, hardcode or guessing 'tops' if unknown, but better to let user pick?
            // User 'category' from store is already available!

            const result = await runMakeItMore(
                selectedModel?.path,
                garment.path,
                category as "tops" | "bottoms" | "one-pieces",
                {
                    prompt,
                    num_samples: numImages,
                    nsfw_filter: true,
                    cover_feet: false,
                    adjust_hands: false,
                    restore_background: true,
                    restore_clothes: true,
                    garment_photo_type: garmentPhotoType,
                    quality: quality, // Pass quality to action
                    aspect_ratio: aspectRatio // Pass aspect ratio
                },
                selectedBackground?.path
            );

            if (result.success && result.path) {
                toast.success("Generation Complete!");
                // Open Result in Viewer or Navigate?
                // Let's offer to view it
                toast.dismiss();
                toast("View Result?", {
                    action: {
                        label: "Open Editor",
                        onClick: () => router.push(`/studio/edit?image=${encodeURIComponent(result.path!)}`)
                    }
                });
            } else {
                toast.error(`Generation Failed: ${result.error}`);
            }

        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex h-full flex-col bg-zinc-50/50 overflow-hidden font-sans text-zinc-900">

            {/* 1. Header & Global Settings */}
            <header className="px-6 py-3 flex flex-col gap-3 bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 shrink-0">
                {/* Row 1: Logo, Prompt, Action */}
                <div className="flex items-center gap-4">
                    <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center text-white font-bold tracking-tighter shrink-0">
                        AI
                    </div>

                    <div className="flex-1 relative group">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 transition-transform group-focus-within:scale-110" />
                        <Input
                            placeholder="Describe your vision (e.g. 'Golden hour, cinematic lighting, fierce expression')..."
                            className="bg-zinc-100/50 border-transparent hover:bg-zinc-100 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 h-10 pl-10 pr-4 text-sm shadow-sm transition-all rounded-xl"
                            value={prompt}
                            onChange={(e) => setParam("prompt", e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Project / Session Info */}
                    {selectedFolder ? (
                        <div className="hidden lg:flex flex-col items-end mr-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Current Session</span>
                            <span className="text-xs font-medium max-w-[150px] truncate" title={selectedFolder}>{selectedFolder.split('/').pop() || 'Untitled'}</span>
                        </div>
                    ) : null}



                    <Button
                        size="sm"
                        className={cn(
                            "h-10 px-6 font-semibold shadow-lg shadow-indigo-500/20 transition-all rounded-xl shrink-0",
                            "bg-black text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                        onClick={handleRun}
                        disabled={isThinking}
                    >
                        {isThinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2 fill-current" />}
                        {isThinking ? "Thinking..." : "Generate"}
                    </Button>
                </div>
            </header>

            {/* Row 2: Tabs & Dropdowns Toolbar */}
            <div className="px-6 py-2 flex items-center justify-between border-b bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
                    {/* Category Tabs */}
                    <Tabs value={category} onValueChange={(v: any) => setParam("category", v)} className="h-8">
                        <TabsList className="h-8 bg-zinc-100/80 p-0.5 rounded-lg border border-zinc-200/50">
                            <TabsTrigger value="tops" className="text-xs h-7 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tops</TabsTrigger>
                            <TabsTrigger value="bottoms" className="text-xs h-7 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Bottoms</TabsTrigger>
                            <TabsTrigger value="one-pieces" className="text-xs h-7 rounded-md px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">One-Pieces</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Separator orientation="vertical" className="h-5" />

                    {/* Dropdowns Group - Pill Style */}
                    <div className="flex items-center gap-2">
                        {/* 1. Aspect Ratio */}
                        <Select value={aspectRatio} onValueChange={(v) => setParam("aspectRatio", v)}>
                            <SelectTrigger className="h-9 px-3 rounded-full border bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-0 shadow-sm min-w-[90px]">
                                <span className="flex items-center gap-2">
                                    <LayoutGrid className="h-3.5 w-3.5 text-zinc-500" />
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1:1">1:1 Square</SelectItem>
                                <SelectItem value="3:4">3:4 Portrait</SelectItem>
                                <SelectItem value="4:3">4:3 Landscape</SelectItem>
                                <SelectItem value="9:16">9:16 Story</SelectItem>
                                <SelectItem value="16:9">16:9 Wide</SelectItem>
                                <SelectItem value="2:3">2:3 Classic Portrait</SelectItem>
                                <SelectItem value="3:2">3:2 Classic Landscape</SelectItem>
                                <SelectItem value="4:5">4:5 Social Portrait</SelectItem>
                                <SelectItem value="5:4">5:4 Social Landscape</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 2. Quality (1K/4K) */}
                        <Select value={quality} onValueChange={(v: any) => setParam("quality", v)}>
                            <SelectTrigger className="h-9 px-3 rounded-full border bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-0 shadow-sm min-w-[70px]">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent className="min-w-[220px]">
                                <SelectItem value="precise" textValue="1K">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">Precise 1K</span>
                                        <span className="text-[10px] text-muted-foreground">Consistent, good instruction</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="balanced" textValue="4K">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">Balanced 4K <Badge variant="secondary" className="text-[10px] px-1 py-0 h-auto">PRO</Badge></span>
                                        <span className="text-[10px] text-muted-foreground">Sharp detail, moderate creativity</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="creative" textValue="4K">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">Creative 4K <Badge variant="secondary" className="text-[10px] px-1 py-0 h-auto">PRO</Badge></span>
                                        <span className="text-[10px] text-muted-foreground">UHD, high styling</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 3. Number of Images */}
                        <Select value={String(numImages)} onValueChange={(v) => setParam("numImages", parseInt(v))}>
                            <SelectTrigger className="h-9 px-3 rounded-full border bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-0 shadow-sm min-w-[70px]">
                                <span className="flex items-center gap-2">
                                    <ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Image</SelectItem>
                                <SelectItem value="2">2 Images</SelectItem>
                                <SelectItem value="3">3 Images</SelectItem>
                                <SelectItem value="4">4 Images</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 4. Garment Type */}
                        <Select value={garmentPhotoType} onValueChange={(v) => setParam("garmentPhotoType", v)}>
                            <SelectTrigger className="h-9 px-3 rounded-full border bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-0 shadow-sm min-w-[100px] text-muted-foreground data-[state=open]:text-foreground">
                                <span className={cn(garmentPhotoType === "auto" && "text-zinc-500", "flex items-center gap-2")}>
                                    <Shirt className="h-3.5 w-3.5" />
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto" textValue="Auto Type">Auto Detect</SelectItem>
                                <SelectItem value="model" textValue="On Model">On Model</SelectItem>
                                <SelectItem value="flat-lay" textValue="Flat Lay">Flat Lay / Dummy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Right Side Toggles */}
                <div className="flex items-center gap-2">
                    <Toggle
                        pressed={useFaceReference}
                        onPressedChange={(p) => setParam("useFaceReference", p)}
                        size="sm"
                        className="h-8 rounded-lg data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 data-[state=on]:border-indigo-200 border bg-transparent text-xs"
                    >
                        <ScanFace className="h-3.5 w-3.5 mr-2" /> Face Ref
                    </Toggle>
                    <Toggle
                        pressed={useImagePrompt}
                        onPressedChange={(p) => setParam("useImagePrompt", p)}
                        size="sm"
                        className="h-8 rounded-lg data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-600 data-[state=on]:border-emerald-200 border bg-transparent text-xs"
                    >
                        <ImageIcon className="h-3.5 w-3.5 mr-2" /> Img Prompt
                    </Toggle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden">
                {/* 2. Main Canvas (The "Stage") */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                    <div className="max-w-6xl mx-auto h-full flex flex-col justify-center gap-8 relative z-10">
                        {/* Composition Grid (3 Slots: Model, Garment, Background) */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                            {/* Slot 1: Model */}
                            <AssetCard
                                title="Model"
                                entry={selectedModel}
                                onSelect={setModel}
                                icon={<ScanFace className="h-8 w-8 text-blue-500" />}
                                colorClass="text-blue-500 bg-blue-50 border-blue-100"
                            />

                            {/* Slot 2: Garment */}
                            <AssetCard
                                title="Garment"
                                entry={selectedGarments}
                                onSelect={setGarments}
                                icon={<Shirt className="h-8 w-8 text-purple-500" />}
                                colorClass="text-purple-500 bg-purple-50 border-purple-100"
                                multiSelect
                            />

                            {/* Slot 3: Background */}
                            <AssetCard
                                title="Background"
                                entry={selectedBackground}
                                onSelect={setBackground}
                                icon={<Layers className="h-8 w-8 text-orange-500" />}
                                colorClass="text-orange-500 bg-orange-50 border-orange-100"
                                optional
                            />
                        </div>

                        {/* Clear Button */}
                        {(selectedModel || selectedGarments.length > 0 || selectedBackground) && (
                            <div className="flex justify-center">
                                <Button variant="ghost" className="text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => (window as any).location.reload()}>
                                    <Undo2 className="h-4 w-4 mr-2" /> Reset Composition
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Sidebar: Advanced */}
                <div className={cn(
                    "w-80 bg-white border-l transition-all duration-300 ease-in-out flex flex-col shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] z-30",
                    !isSidebarOpen && "w-0 opacity-0 overflow-hidden border-none"
                )}>
                    {/* ... sidebar content ... */}
                    <div className="p-5 border-b flex items-center justify-between bg-zinc-50/50">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Fine Tune</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsSidebarOpen(false)}>
                            <PanelRightClose className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-8">
                        {/* Sliders - CONNECTED TO STORE */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Creativity</label>
                                <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{creativity}</span>
                            </div>
                            <Slider
                                value={[creativity]}
                                onValueChange={([v]) => setParam("creativity", v)}
                                max={1}
                                step={0.1}
                            />
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Higher values produce more imaginative results but may deviate from the reference.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Resemblance</label>
                                <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{resemblance}</span>
                            </div>
                            <Slider
                                value={[resemblance]}
                                onValueChange={([v]) => setParam("resemblance", v)}
                                max={1}
                                step={0.1}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Structure Match</label>
                                <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{structureMatch}</span>
                            </div>
                            <Slider
                                value={[structureMatch]}
                                onValueChange={([v]) => setParam("structureMatch", v)}
                                max={1}
                                step={0.1}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div >
    );
}

// Sub-component for Asset Cards to keep code clean
function AssetCard({
    title,
    entry,
    onSelect,
    icon,
    colorClass,
    optional = false,
    multiSelect = false
}: {
    title: string;
    entry: FileEntry | FileEntry[] | null;
    onSelect: (f: any) => void;
    icon: React.ReactNode;
    colorClass: string;
    optional?: boolean;
    multiSelect?: boolean;
}) {
    const hasEntry = Array.isArray(entry) ? entry.length > 0 : !!entry;
    const entries = Array.isArray(entry) ? entry : (entry ? [entry] : []);

    return (
        <Card className={cn(
            "aspect-[3/4] rounded-2xl overflow-hidden relative group transition-all duration-300 flex flex-col",
            hasEntry ? "shadow-md border-transparent ring-1 ring-zinc-200 bg-white" : "border-dashed border-2 hover:border-zinc-400 bg-zinc-50/50 shadow-none"
        )}>
            {hasEntry ? (
                <>
                    {entries.length === 1 ? (
                        <img
                            src={`/api/filesystem/image?path=${encodeURIComponent(entries[0].path)}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="grid grid-cols-2 h-full w-full">
                            {entries.slice(0, 4).map((f, i) => (
                                <img
                                    key={i}
                                    src={`/api/filesystem/image?path=${encodeURIComponent(f.path)}`}
                                    className="w-full h-full object-cover border-r border-b"
                                />
                            ))}
                            {entries.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                                    +{entries.length - 4}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Overlay name */}
                    <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10">
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-black text-[10px] font-bold shadow-sm">
                                {title} {entries.length > 1 && `(${entries.length})`}
                            </Badge>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity scale-90"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(multiSelect ? [] : null);
                                }}
                            >
                                <XCircle className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-10">
                        <FileExplorerDialog onSelect={onSelect} multiSelect={multiSelect}>
                            <Button className="w-full bg-white text-black hover:bg-zinc-100 shadow-xl font-semibold">
                                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Change {title}
                            </Button>
                        </FileExplorerDialog>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm mb-2", colorClass)}>
                        {icon}
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900">{title}</h3>
                        <p className="text-xs text-muted-foreground">
                            {optional ? "Optional background" : `Select ${title.toLowerCase()}`}
                        </p>
                    </div>
                    <FileExplorerDialog onSelect={onSelect} multiSelect={multiSelect}>
                        <Button variant="outline" className="rounded-full px-6 hover:bg-white hover:shadow-md transition-all">
                            <Plus className="h-3.5 w-3.5 mr-2" /> Select
                        </Button>
                    </FileExplorerDialog>
                </div>
            )}
        </Card>
    );
}

// Wrapper Helper
function FileExplorerDialog({ onSelect, multiSelect, children }: { onSelect: (f: any) => void, multiSelect?: boolean, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl h-[70vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
                <div className="px-6 py-4 border-b bg-zinc-50">
                    <h2 className="text-lg font-semibold">Select Asset {multiSelect && "(Multi-Select)"}</h2>
                </div>
                <div className="flex-1 min-h-0 bg-white">
                    <FileExplorer
                        allowMultiSelect={multiSelect}
                        onSelectFolder={() => { }}
                        onSelectFile={(f) => {
                            onSelect(f);
                            setOpen(false);
                        }}
                        onSelectFiles={(files) => {
                            onSelect(files);
                            setOpen(false);
                        }}
                        className="h-full border-none shadow-none rounded-none"
                        initialPath=""
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
