"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { runTryOnAction } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileExplorer } from "@/components/file-explorer";
import { ModelSelector } from "@/components/model-selector";
import {
    Upload,
    Image as ImageIcon,
    Play,
    Copy,
    Maximize2,
    MoreHorizontal,
    X,
    Sparkles,
    LayoutGrid,
    ArrowLeftRight,
    Shirt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

export default function TryOnPage() {
    // State
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState("3:4");
    const [numImages, setNumImages] = useState("1");
    const [resolution, setResolution] = useState("1k");
    const [category, setCategory] = useState("tops");
    const [categories, setCategories] = useState<{ label: string, value: string }[]>([]);

    useEffect(() => {
        fetch("/api/admin/resource-categories")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data);
                }
            })
            .catch(err => console.error("Failed to load categories", err));
    }, []);

    // Upload States
    const [productImage, setProductImage] = useState<string | null>(null);
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);

    // Gallery Modal State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [activeUploadTarget, setActiveUploadTarget] = useState<"product" | "face" | "bg" | null>(null);

    const handleFileSelect = (file: FileEntry) => {
        const imageUrl = `/api/filesystem/image?path=${encodeURIComponent(file.path)}`;

        switch (activeUploadTarget) {
            case "product":
                setProductImage(imageUrl);
                break;
            case "face":
                setFaceImage(imageUrl);
                break;
            case "bg":
                setBgImage(imageUrl);
                break;
        }
        setIsGalleryOpen(false);
        setActiveUploadTarget(null);
    };

    const openGallery = (target: "product" | "face" | "bg") => {
        setActiveUploadTarget(target);
        setIsGalleryOpen(true);
    };

    const handleRun = async () => {
        if (!productImage && !faceImage) {
            toast.error("Please select a Product or Face Reference");
            return;
        }

        // Determine what logic to run
        // If we have face + product -> TryOn
        // If we have product only -> Product to Model (but simplified)

        toast.info("Starting generation...", {
            description: "Connecting to Fashn.ai API"
        });

        // Simplified logic: Assume Try-On for now as this is "Try-On" page
        // But we need a garment and a model.
        // In this UI:
        // Product = Garment?
        // Face Ref = Model? 
        // Let's assume User uploads Garment to "Product" tab and Model to "Face Ref" tab?
        // Or "Product" is the item to be worn? 
        // "Face Ref" is the person?

        // MAPPING:
        // Product Tab -> Garment
        // Face Ref Tab -> Model
        // Bg Ref Tab -> Background

        // Extract paths (remove /api/filesystem/image?path=...)
        const cleanPath = (url: string | null) => {
            if (!url) return null;
            return decodeURIComponent(url.replace("/api/filesystem/image?path=", ""));
        };

        const garmentPath = cleanPath(productImage);
        const modelPath = cleanPath(faceImage);
        const bgPath = cleanPath(bgImage);

        if (!garmentPath || !modelPath) {
            toast.error("For Try-On, please provide both a Product (Garment) and Face Reference (Model).");
            return;
        }

        const result = await runTryOnAction(
            modelPath,
            garmentPath,
            category,
            {
                prompt,
                aspect_ratio: aspectRatio as any,
                num_samples: parseInt(numImages),
                nsfw_filter: true,
                cover_feet: false,
                adjust_hands: false,
                restore_background: true,
                restore_clothes: true,
                garment_photo_type: "auto",
                quality: (resolution === "4k" || resolution === "1k") ? "precise" : "balanced"
            }
        );

        if (result.success) {
            toast.success("Generation Complete!");
        } else {
            toast.error("Generation Failed", { description: result.error });
        }
    };

    // Helper for Upload Area
    const UploadArea = ({
        label,
        image,
        onClear,
        onGalleryClick,
        placeholderIcon: Icon = ImageIcon,
        showModelSelector = false,
        onModelSelect
    }: {
        label: string,
        image: string | null,
        onClear: () => void,
        onGalleryClick: () => void,
        placeholderIcon?: any,
        showModelSelector?: boolean,
        onModelSelect?: (url: string) => void
    }) => (
        <div className="flex-1 flex flex-col h-full min-h-[400px]">
            {image ? (
                <div className="relative w-full h-full bg-muted/20 rounded-lg overflow-hidden border">
                    <img src={image} alt="Selected" className="w-full h-full object-contain" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/5 gap-4 hover:bg-muted/10 transition-colors">
                    <div className="absolute inset-0 z-[-1] opacity-[0.03]"
                        style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                    />

                    <div className="p-4 rounded-full bg-background shadow-sm">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Copy className="h-4 w-4" /> Paste
                            </Button>
                            {/* Run Try-On Button was duplicate here? Removing for cleaner UI as main button is in header */}
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[200px]">
                            <Button variant="secondary" size="sm" className="gap-2 w-full" onClick={onGalleryClick}>
                                <ImageIcon className="h-4 w-4" /> Choose from Gallery
                            </Button>

                            {showModelSelector && onModelSelect && (
                                <ModelSelector onSelect={onModelSelect} />
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">/ drop image here</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header Controls */}
            <Card className="rounded-xl border-none shadow-sm bg-white">
                <CardContent className="p-2 flex items-center gap-2">
                    <Input
                        placeholder="Optional: Blonde hair, studio photoshoot"
                        className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="flex items-center gap-2 border-l pl-2">

                        {/* Category Select */}
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 px-3 rounded-full border bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-0 shadow-sm min-w-[90px]">
                                <span className="flex items-center gap-2">
                                    <Shirt className="h-3.5 w-3.5 text-zinc-500" />
                                    <SelectValue placeholder="Category" />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {categories.length > 0 ? categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                )) : (
                                    <>
                                        <SelectItem value="tops">Tops</SelectItem>
                                        <SelectItem value="bottoms">Bottoms</SelectItem>
                                        <SelectItem value="one-pieces">One-Pieces</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        <Select value={resolution} onValueChange={setResolution}>
                            <SelectTrigger className="h-9 px-3 rounded-full border bg-white hover:bg-zinc-50 transition-colors text-xs font-medium focus:ring-0 shadow-sm min-w-[70px]">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1k">1K</SelectItem>
                                <SelectItem value="2k">2K</SelectItem>
                                <SelectItem value="4k">4K</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={numImages} onValueChange={setNumImages}>
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

                        <Button
                            className="h-9 gap-2 bg-[#F3D398] text-black hover:bg-[#EBC57E] font-medium"
                            onClick={handleRun}
                        >
                            <Play className="h-4 w-4 fill-current" />
                            Run Try-On (~30s)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Area */}
            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex gap-6 pb-2">
                {/* Left: Model (Face Reference) */}
                <Card className="flex-1 flex flex-col border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="flex-1 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Maximize2 className="h-4 w-4" /> Select Model
                            </h3>
                            {/* Optional: Add help tooltip */}
                        </div>
                        <UploadArea
                            label="Face Reference"
                            image={faceImage}
                            onClear={() => setFaceImage(null)}
                            onGalleryClick={() => openGallery("face")}
                            showModelSelector={true}
                            onModelSelect={setFaceImage}
                        />
                    </CardContent>
                </Card>

                {/* Arrow / Separator */}
                <div className="flex flex-col justify-center items-center">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                {/* Right: Garment (Product) */}
                <Card className="flex-1 flex flex-col border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="flex-1 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Shirt className="h-4 w-4" /> Select Garment
                            </h3>
                        </div>
                        <UploadArea
                            label="Product"
                            image={productImage}
                            onClear={() => setProductImage(null)}
                            onGalleryClick={() => openGallery("product")}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Gallery Dialog */}
            <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Select Image from Gallery</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 min-h-0">
                        <FileExplorer
                            onSelectFolder={() => { }}
                            onSelectFile={handleFileSelect}
                            className="h-full border-none shadow-none"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
