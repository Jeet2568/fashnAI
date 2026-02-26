"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Wand2,
    Eraser,
    Undo2,
    Redo2,
    Download,
    Image as ImageIcon,
    Upload,
    X,
    Brush,
    Layers,
    Move,
    Maximize2,
    Check,
    Loader2,
    Crop,
    Scissors,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileExplorer } from "@/components/file-explorer";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
// Fix Import Path:
import { useTryOnStore } from "@/app/(studio)/studio/product-to-model/store";

function EditorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const imagePath = searchParams.get("image");

    // Canvas Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // State
    const [activeTool, setActiveTool] = useState<"brush" | "eraser" | "pan">("brush");
    const [brushSize, setBrushSize] = useState(40);
    const [isDrawing, setIsDrawing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Navigation State
    const [activeTab, setActiveTab] = useState("edit");
    const [showGalleryDialog, setShowGalleryDialog] = useState(false);

    // Initial Load
    useEffect(() => {
        if (imagePath) {
            loadImage(imagePath);
        }
    }, [imagePath]);

    const loadImage = (path: string) => {
        const img = new Image();
        img.src = `/api/filesystem/image?path=${encodeURIComponent(path)}`;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            if (imageRef.current && containerRef.current && canvasRef.current) {
                // Resize logic could go here to fit container
                imageRef.current.src = img.src;

                // Initialize Canvas
                const canvas = canvasRef.current;
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;

                // Clear existing
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

                setImageLoaded(true);
            }
        };
    };

    // Drawing Logic
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool === "pan") return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // White semi-transparent mask
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || activeTool === "pan") return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) ctx.closePath();
    };

    // Handlers
    const handleGenerate = async () => {
        if (!prompt) {
            toast.error("Please describe what to change");
            return;
        }
        if (!imagePath) return;

        setIsProcessing(true);
        const canvas = canvasRef.current;

        try {
            // Get Mask Base64
            const maskBase64 = canvas?.toDataURL("image/png");

            const res = await fetch("/api/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imagePath,
                    maskImage: maskBase64,
                    prompt
                })
            });

            if (!res.ok) throw new Error("Edit failed");

            const data = await res.json();

            toast.success("Edit Saved to Results!");

            // Optionally redirect to the new image or reload
            // For now, just show success

        } catch (error) {
            toast.error("Failed to generate edit");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearMask = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleGallerySelect = (file: any) => {
        setShowGalleryDialog(false);
        // Changed route to /admin/edit
        router.push(`/admin/edit?image=${encodeURIComponent(file.path)}`);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-center pt-6 pb-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="bg-muted/50 border border-border">
                        <TabsTrigger value="edit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                            <Wand2 className="h-4 w-4" /> Edit
                        </TabsTrigger>
                        <TabsTrigger value="faceswap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                            <RefreshCw className="h-4 w-4" /> Face Swap
                        </TabsTrigger>
                        <TabsTrigger value="removebg" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                            <Scissors className="h-4 w-4" /> Remove BG
                        </TabsTrigger>
                        <TabsTrigger value="reframe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                            <Crop className="h-4 w-4" /> Reframe
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Prompt Bar */}
            <div className="px-6 py-2 max-w-4xl mx-auto w-full">
                <div className="relative">
                    <Input
                        placeholder="What would you like to change? (e.g. 'Make the shirt red')"
                        className="h-12 pl-4 pr-32 text-base shadow-sm border-input bg-background"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-2 max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeTool === "brush" ? "secondary" : "outline"}
                        size="sm"
                        className={cn("gap-2", activeTool === "brush" ? "bg-muted text-foreground" : "bg-background border-border text-muted-foreground")}
                        onClick={() => setActiveTool("brush")}
                    >
                        <Brush className="h-4 w-4" /> Brush
                    </Button>

                    {activeTool === "brush" && (
                        <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md border border-border">
                            <span className="text-xs text-muted-foreground font-medium w-8">{brushSize}px</span>
                            <Slider
                                value={[brushSize]}
                                onValueChange={(v) => setBrushSize(v[0])}
                                max={100}
                                step={1}
                                className="w-24"
                            />
                        </div>
                    )}

                    <Button
                        variant={activeTool === "eraser" ? "secondary" : "outline"}
                        size="icon"
                        className={cn("h-9 w-9", activeTool === "eraser" ? "bg-muted" : "bg-background border-border text-muted-foreground")}
                        onClick={() => setActiveTool("eraser")}
                        title="Eraser"
                    >
                        <Eraser className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearMask}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        Clear Mask
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Select defaultValue="1k">
                        <SelectTrigger className="h-9 w-[80px] bg-background border-border">
                            <SelectValue placeholder="Res" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1k">1K</SelectItem>
                            <SelectItem value="2k">2K</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handleGenerate}
                        disabled={isProcessing || !imageLoaded}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Edit (~12s)
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 p-6 flex items-center justify-center min-h-0">
                <div
                    ref={containerRef}
                    className="relative w-full max-w-4xl h-full max-h-[600px] rounded-2xl bg-background shadow-sm border border-border overflow-hidden flex items-center justify-center"
                >
                    {!imagePath ? (
                        <div className="text-center space-y-4">
                            <div className="flex flex-col gap-3">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="bg-background hover:bg-accent border-dashed border-2 h-14"
                                >
                                    <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
                                    Paste / Drop image here
                                </Button>

                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">OR</div>

                                <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                                            <ImageIcon className="h-5 w-5 mr-2" />
                                            Choose from Gallery
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                                        <DialogTitle className="sr-only">Select Image</DialogTitle>
                                        <div className="p-4 border-b">
                                            <h2 className="text-lg font-bold">Select Image</h2>
                                        </div>
                                        <div className="flex-1 overflow-hidden p-4 bg-muted/10">
                                            <FileExplorer
                                                onSelectFile={handleGallerySelect}
                                                onSelectFolder={() => { }}
                                                defaultView="grid"
                                                className="h-full bg-background border"
                                                syncStore={false}
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Base Image */}
                            <img
                                ref={imageRef}
                                src=""
                                alt="Editing Target"
                                className="absolute object-contain max-w-full max-h-full z-10 pointer-events-none select-none"
                            />

                            {/* Mask Canvas */}
                            <canvas
                                ref={canvasRef}
                                className={cn(
                                    "absolute z-20 touch-none cursor-crosshair",
                                    activeTool === "pan" && "cursor-move"
                                )}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminEditPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EditorContent />
        </Suspense>
    );
}
