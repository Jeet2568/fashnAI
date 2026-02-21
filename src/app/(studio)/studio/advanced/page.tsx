"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FileExplorer } from "@/components/file-explorer";
import { ResourceSelector } from "@/components/resource-selector";
import { useTryOnStore } from "../product-to-model/store";

import { cn } from "@/lib/utils";
import { ImagePlus, Images, ChevronDown, LayoutGrid, Sparkles, Image as ImageIcon, RefreshCw, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface ResourceField {
    id: string;
    name: string;
    prompt: string | null;
    thumbnail: string;
}

interface PerImageConfig {
    id: string;
    photo: FileEntry | null;
    garmentMode: "top" | "bottom" | "auto";
    model: ResourceField | null;
    pose: ResourceField | null;
    angle: ResourceField | null;
}

const DEFAULT_CONFIG: PerImageConfig = {
    id: "",
    photo: null,
    garmentMode: "auto",
    model: null,
    pose: null,
    angle: null,
};

export default function AdvancedBatchGeneratePage() {
    // --- Global State ---
    const { selectedFolder } = useTryOnStore();
    const [numPhotos, setNumPhotos] = useState<number>(5);
    const [globalRatio, setGlobalRatio] = useState("3:4");
    const [globalQuality, setGlobalQuality] = useState("balanced");

    const [gender, setGender] = useState<"male" | "female">("female");
    const [garmentType, setGarmentType] = useState("Dress");

    // --- Global Background ---
    const [bgType, setBgType] = useState<"prompt" | "select">("prompt");
    const [bgPrompt, setBgPrompt] = useState("");
    const [selectedBackground, setSelectedBackground] = useState<ResourceField | null>(null);

    // --- Accessories ---
    const [accEnabled, setAccEnabled] = useState(false);
    const [selectedAccessories, setSelectedAccessories] = useState<Record<string, ResourceField>>({});

    // --- Per Image Configurations ---
    const [configs, setConfigs] = useState<PerImageConfig[]>(
        Array.from({ length: 5 }, (_, i) => ({ ...DEFAULT_CONFIG, id: `photo-${i + 1}` }))
    );

    const handleNumPhotosChange = (newCount: number) => {
        if (newCount < 1 || newCount > 20) return;
        setNumPhotos(newCount);

        setConfigs(prev => {
            if (newCount > prev.length) {
                const additions = Array.from({ length: newCount - prev.length }, (_, i) => ({
                    ...DEFAULT_CONFIG,
                    id: `photo-${prev.length + i + 1}`
                }));
                return [...prev, ...additions];
            } else if (newCount < prev.length) {
                return prev.slice(0, newCount);
            }
            return prev;
        });
    };

    const updateConfig = (index: number, updates: Partial<PerImageConfig>) => {
        setConfigs(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    // Shared global section style matching standard cards
    const globalSectionClass = "w-[800px] flex items-center justify-center p-4 rounded-xl border bg-white shadow-sm transition-all";

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -mx-6 -my-6 bg-zinc-50/50 font-sans text-zinc-900">
            {/* Top Fixed Control Bar */}
            <header className="px-6 py-3 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center text-white font-bold tracking-tighter shrink-0">
                        AI
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-tight text-slate-800">Advanced Batch Configuration</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Reusable Select setup from product-to-model */}
                    <div className="flex items-center gap-2 mr-4">
                        <Label htmlFor="num-photos" className="text-xs font-semibold text-muted-foreground mr-2">Num Images:</Label>
                        <Input
                            id="num-photos"
                            type="number"
                            min={1}
                            max={50}
                            value={numPhotos}
                            onChange={(e) => handleNumPhotosChange(parseInt(e.target.value) || 1)}
                            className="w-16 h-9 text-center bg-white border shadow-sm rounded-full text-xs font-medium focus-visible:ring-1"
                        />

                        <Select value={globalRatio} onValueChange={setGlobalRatio}>
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
                            </SelectContent>
                        </Select>

                        <Select value={globalQuality} onValueChange={setGlobalQuality}>
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
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        size="sm"
                        className="h-10 px-6 font-semibold shadow-lg transition-all rounded-xl shrink-0 bg-black text-white hover:bg-zinc-800"
                        onClick={() => console.log("Final Generation", configs)}
                    >
                        Batch Generate ({numPhotos})
                    </Button>
                </div>
            </header>

            {/* Parallel Flowchart UI - Standard App Styling */}
            <ScrollArea className="flex-1 w-full bg-zinc-50/50">
                <div className="min-w-max px-12 py-12 flex flex-col items-center gap-8 pb-32">

                    {/* ROW 1: Source Photos */}
                    <div className="flex gap-6 w-full justify-center relative">
                        {/* Background connection line */}
                        <div className="absolute top-[80px] w-full h-px bg-slate-200 -z-10" />

                        {configs.map((config, i) => (
                            <FileExplorerDialog key={`photo-${i}`} initialPath={selectedFolder ? `${selectedFolder}/RAW` : ""} onSelect={f => updateConfig(i, { photo: f })}>
                                <Card className={cn(
                                    "w-56 h-72 flex flex-col rounded-2xl bg-white overflow-hidden relative cursor-pointer transition-all group shadow-none",
                                    config.photo ? "border ring-1 ring-zinc-200" : "border-2 border-dashed border-zinc-200 hover:border-zinc-400 items-center justify-center p-4"
                                )}>
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-zinc-100/90 backdrop-blur rounded text-[10px] font-bold text-zinc-500 z-20 shadow-sm border border-zinc-200/50">
                                        IMG {i + 1}
                                    </div>

                                    {config.photo ? (
                                        <>
                                            <img
                                                src={`/api/filesystem/image?path=${encodeURIComponent(config.photo.path)}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                alt={`Input ${i + 1}`}
                                            />
                                            {/* Bottom Action Overlay */}
                                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-10 flex flex-col items-center">
                                                <Button variant="secondary" size="sm" className="w-full bg-white text-black hover:bg-zinc-100 shadow-xl font-semibold mb-2" onClick={(e) => { }}>
                                                    <RefreshCw className="h-3.5 w-3.5 mr-2" /> Change Photo
                                                </Button>
                                                <div
                                                    className="text-[10px] font-semibold text-red-300 hover:text-red-400 cursor-pointer flex items-center bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"
                                                    onClick={(e) => { e.stopPropagation(); updateConfig(i, { photo: null }); }}
                                                >
                                                    <XCircle className="h-3 w-3 mr-1" /> REMOVE
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600 transition-colors mb-4 border">
                                                <ImagePlus className="w-8 h-8" />
                                            </div>
                                            <span className="text-sm font-semibold text-zinc-500 transition-colors">Select Input Photo</span>
                                        </>
                                    )}
                                </Card>
                            </FileExplorerDialog>
                        ))}
                    </div>

                    {/* ROW 2: Garment Selection (Per Image) */}
                    <div className="flex gap-6 w-full justify-center">
                        {configs.map((config, i) => (
                            <div key={`gsel-${i}`} className="w-56 flex justify-center">
                                <div className="flex items-center bg-white rounded-lg border shadow-sm p-1">
                                    <Button
                                        variant={config.garmentMode === "top" ? "default" : "ghost"}
                                        size="sm" className="h-8 px-3 text-xs"
                                        onClick={() => updateConfig(i, { garmentMode: "top" })}
                                    >Top</Button>
                                    <Button
                                        variant={config.garmentMode === "bottom" ? "default" : "ghost"}
                                        size="sm" className="h-8 px-3 text-xs"
                                        onClick={() => updateConfig(i, { garmentMode: "bottom" })}
                                    >Bot</Button>
                                    <Button
                                        variant={config.garmentMode === "auto" ? "default" : "ghost"}
                                        size="sm" className="h-8 px-3 text-xs"
                                        onClick={() => updateConfig(i, { garmentMode: "auto" })}
                                    >Auto</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 3: Gender (Global) */}
                    <div className={globalSectionClass}>
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Gender</span>
                            <div className="flex items-center space-x-1 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50">
                                <Button
                                    variant="ghost"
                                    onClick={() => setGender("male")}
                                    className={cn("px-8 rounded-md h-8 text-sm", gender === "male" && "bg-white shadow-sm font-medium")}
                                >Male</Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setGender("female")}
                                    className={cn("px-8 rounded-md h-8 text-sm", gender === "female" && "bg-white shadow-sm font-medium")}
                                >Female</Button>
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 4: Select Model (Per Image) */}
                    <div className="flex gap-6 w-full justify-center relative">
                        <div className="absolute top-[20px] w-full h-px bg-slate-200 -z-10" />
                        {configs.map((config, i) => (
                            <div key={`model-${i}`} className="w-56 flex justify-center">
                                <ResourceSelector
                                    type="model"
                                    onSelect={(res) => updateConfig(i, { model: res })}
                                    trigger={
                                        <Button variant="outline" className="w-[180px] h-10 bg-white border shadow-sm text-zinc-700 justify-between truncate pr-3">
                                            <span className="truncate flex-1 text-left">{config.model?.name || "Select Model"}</span>
                                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                                        </Button>
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 5: Garment Type (Global) */}
                    <div className={globalSectionClass}>
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Garment Type</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[240px] h-10 bg-white border shadow-sm text-zinc-700 justify-between">
                                        {garmentType}
                                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[240px]">
                                    {["T-shirt", "Dress", "Jeans", "Jacket", "Skirt"].map(type => (
                                        <DropdownMenuItem key={type} onClick={() => setGarmentType(type)}>{type}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 6: Accessories Toggle (Global) */}
                    <div className={cn(globalSectionClass, "flex-col items-center p-6 gap-6")}>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Advanced Accessories</span>
                            <div className="w-px h-6 bg-slate-200 mx-2" />
                            <Label className="text-sm cursor-pointer" onClick={() => setAccEnabled(true)}>Enabled</Label>
                            <Switch checked={accEnabled} onCheckedChange={setAccEnabled} />
                            <Label className="text-sm text-muted-foreground cursor-pointer" onClick={() => setAccEnabled(false)}>Disabled</Label>
                        </div>

                        {/* ROW 7: Accessory Types (If Enabled) */}
                        {accEnabled && (
                            <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-slate-100 w-full">
                                {["Earrings", "Necklace", "Bracelet", "Rings", "Shoes", "Watch", "Handbag"].map(acc => (
                                    <ResourceSelector
                                        key={acc}
                                        type={acc.toLowerCase()}
                                        onSelect={(res) => setSelectedAccessories(prev => ({ ...prev, [acc]: res }))}
                                        trigger={
                                            <Button
                                                variant={selectedAccessories[acc] ? "default" : "outline"}
                                                className={cn("bg-white text-zinc-700 px-6 h-9 shadow-sm relative transition-all", selectedAccessories[acc] && "bg-indigo-50 border-indigo-200 text-indigo-700 pr-10 hover:bg-indigo-100")}
                                            >
                                                {selectedAccessories[acc] ? selectedAccessories[acc].name : acc}
                                                {selectedAccessories[acc] && (
                                                    <div
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-indigo-200/50 text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            const newAcc = { ...selectedAccessories };
                                                            delete newAcc[acc];
                                                            setSelectedAccessories(newAcc);
                                                        }}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </Button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 8: Pose Title (Global) */}
                    <div className="flex justify-center w-full">
                        <div className="bg-white px-6 py-2 border rounded-lg shadow-sm text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Configure Stance
                        </div>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 9: Select Pose (Per Image) */}
                    <div className="flex gap-6 w-full justify-center relative">
                        <div className="absolute top-[20px] w-full h-px bg-slate-200 -z-10" />
                        {configs.map((config, i) => (
                            <div key={`pose-${i}`} className="w-56 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Pose {i + 1}</span>
                                <ResourceSelector
                                    type="pose"
                                    onSelect={(res) => updateConfig(i, { pose: res })}
                                    trigger={
                                        <Button variant="outline" className="w-[160px] h-10 bg-white border shadow-sm text-zinc-700 justify-between truncate pr-3">
                                            <span className="truncate flex-1 text-left">{config.pose?.name || "Auto Pose"}</span>
                                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                                        </Button>
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 11: Select Angle (Per Image) */}
                    <div className="flex gap-6 w-full justify-center relative">
                        <div className="absolute top-[20px] w-full h-px bg-slate-200 -z-10" />
                        {configs.map((config, i) => (
                            <div key={`angle-${i}`} className="w-56 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Angle {i + 1}</span>
                                <ResourceSelector
                                    type="angle"
                                    onSelect={(res) => updateConfig(i, { angle: res })}
                                    trigger={
                                        <Button variant="outline" className="w-[160px] h-10 bg-white border shadow-sm text-zinc-700 justify-between truncate pr-3">
                                            <span className="truncate flex-1 text-left">{config.angle?.name || "Full Body"}</span>
                                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                                        </Button>
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* ROW 12: Background Toggle & Input (Global) */}
                    <div className={cn(globalSectionClass, "flex-col items-center p-6 gap-6")}>
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Environment</span>
                            <div className="flex items-center space-x-1 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50">
                                <Button
                                    variant="ghost"
                                    onClick={() => setBgType("prompt")}
                                    className={cn("px-6 h-8 text-sm", bgType === "prompt" && "bg-white shadow-sm font-medium")}
                                >Text Prompt</Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setBgType("select")}
                                    className={cn("px-6 h-8 text-sm", bgType === "select" && "bg-white shadow-sm font-medium")}
                                >Select Environment</Button>
                            </div>
                        </div>

                        {bgType === "prompt" && (
                            <div className="w-full max-w-2xl relative group">
                                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Describe the background scene (e.g. 'Street photography in Paris')..."
                                    value={bgPrompt}
                                    onChange={(e) => setBgPrompt(e.target.value)}
                                    className="h-10 pl-10 bg-zinc-50 border shadow-sm transition-all focus:bg-white"
                                />
                            </div>
                        )}
                        {bgType === "select" && (
                            selectedBackground ? (
                                <div className="w-full max-w-2xl h-24 rounded-lg border-2 border-indigo-200 bg-indigo-50/30 shadow-sm flex items-center p-3 relative group transition-all">
                                    <img src={selectedBackground.thumbnail} className="w-16 h-16 rounded object-cover shadow-sm mr-4" alt="bg-thumb" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-zinc-800 truncate">{selectedBackground.name}</div>
                                        {selectedBackground.prompt && (
                                            <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{selectedBackground.prompt}</div>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={() => setSelectedBackground(null)}>
                                        <XCircle className="w-5 h-5" />
                                    </Button>
                                </div>
                            ) : (
                                <ResourceSelector
                                    type="background"
                                    onSelect={setSelectedBackground}
                                    trigger={
                                        <div className="w-full max-w-2xl h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 cursor-pointer hover:bg-white hover:border-zinc-400 transition-all">
                                            <Images className="w-6 h-6 mb-2 opacity-50" />
                                            <span className="text-sm font-medium">Browse Environment Library</span>
                                        </div>
                                    }
                                />
                            )
                        )}
                    </div>

                    {/* ROW 14: Output Placeholders (Per Image) */}
                    <div className="flex gap-6 w-full justify-center mt-12 mb-12 relative">
                        <div className="absolute top-[20px] w-full h-px bg-slate-200 -z-10" />
                        {configs.map((config, i) => (
                            <div key={`out-${i}`} className="w-56 h-[300px] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 bg-white shadow-sm">
                                <span className="text-2xl font-bold text-zinc-300">{i + 1}</span>
                                <span className="text-sm font-medium text-zinc-400 mt-2">Ready</span>
                            </div>
                        ))}
                    </div>

                </div>
                <ScrollBar orientation="horizontal" className="h-3 bg-zinc-100 border-t" />
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </div>
    );
}

// Wrapper Helper for File Explorer Dialog
function FileExplorerDialog({ onSelect, multiSelect, initialPath, children }: { onSelect: (f: any) => void, multiSelect?: boolean, initialPath?: string, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl h-[70vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
                <div className="px-6 py-4 border-b bg-zinc-50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Select Input Image</h2>
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
                        initialPath={initialPath || ""}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
