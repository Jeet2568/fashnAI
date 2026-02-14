"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Wand2,
    Download,
    Image as ImageIcon,
    Upload,
    X,
    Loader2,
    ScanFace,
    Ratio,
    Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function ModelSwapContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [faceReference, setFaceReference] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Dialogs
    const [showSourceDialog, setShowSourceDialog] = useState(false);
    const [showFaceDialog, setShowFaceDialog] = useState(false);

    const handleSourceSelect = (file: any) => {
        setSourceImage(file.path);
        setShowSourceDialog(false);
    };

    const handleFaceSelect = (file: any) => {
        setFaceReference(file.path);
        setShowFaceDialog(false);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            toast.error("Please select a source image");
            return;
        }
        setIsProcessing(true);

        try {
            const res = await fetch("/api/model-swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceImage,
                    faceReference,
                    prompt
                })
            });

            if (!res.ok) throw new Error("Swap failed");

            const data = await res.json();
            toast.success("Model Swap Saved to Results!");

            // Optionally view result

        } catch (error) {
            toast.error("Failed to swap model");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FDFBF7]">
            {/* Top Bar */}
            <div className="px-6 py-4 max-w-5xl mx-auto w-full flex items-center gap-3">
                <div className="relative flex-1">
                    <Input
                        placeholder="Describe your model's features (e.g. Japanese, indigo hair)"
                        className="h-12 pl-4 text-base shadow-sm border-zinc-200 bg-white"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <Select defaultValue="1">
                    <SelectTrigger className="h-12 w-[80px] bg-white border-zinc-200">
                        <Monitor className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Ratio" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1:1</SelectItem>
                        <SelectItem value="0.75">3:4</SelectItem>
                        <SelectItem value="1.77">16:9</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="1k">
                    <SelectTrigger className="h-12 w-[80px] bg-white border-zinc-200">
                        <SelectValue placeholder="Res" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1k">1K</SelectItem>
                        <SelectItem value="2k">2K</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    className="h-12 px-6 bg-[#FCD34D] hover:bg-[#FBBF24] text-black border border-[#F59E0B]/20 font-medium"
                    onClick={handleGenerate}
                    disabled={isProcessing || !sourceImage}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Model Swap (~12s)
                        </>
                    )}
                </Button>
            </div>

            {/* Context Bar */}
            <div className="px-6 max-w-5xl mx-auto w-full mb-4">
                <Dialog open={showFaceDialog} onOpenChange={setShowFaceDialog}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "bg-white border-zinc-200 shadow-sm h-10 gap-2",
                                faceReference && "border-indigo-500 bg-indigo-50 text-indigo-700"
                            )}
                        >
                            <ScanFace className="h-4 w-4" />
                            {faceReference ? "Face Reference Active" : "Face Reference"}
                            {faceReference && (
                                <X
                                    className="h-3 w-3 ml-2 text-indigo-400 hover:text-indigo-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFaceReference(null);
                                    }}
                                />
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-bold">Select Face Reference</h2>
                        </div>
                        <div className="flex-1 overflow-hidden p-4 bg-zinc-50">
                            <FileExplorer
                                onSelectFile={handleFaceSelect}
                                onSelectFolder={() => { }}
                                defaultView="grid"
                                className="h-full bg-white border"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 p-6 flex items-center justify-center min-h-0">
                <div className="relative w-full max-w-2xl h-full max-h-[700px] rounded-2xl bg-white shadow-sm border border-[#EBE5D5] overflow-hidden flex items-center justify-center group">
                    {!sourceImage ? (
                        <div className="text-center space-y-4 p-8">
                            <div className="flex flex-col gap-3 items-center">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="bg-white hover:bg-zinc-50 border-dashed border-2 h-14 w-full"
                                >
                                    <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
                                    Paste / Drop image here
                                </Button>

                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider py-2">OR</div>

                                <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="bg-[#F5F2EA] hover:bg-[#EBE5D5] text-[#A79776] w-full">
                                            <ImageIcon className="h-5 w-5 mr-2" />
                                            Choose from Gallery
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                                        <div className="p-4 border-b">
                                            <h2 className="text-lg font-bold">Select Source Image</h2>
                                        </div>
                                        <div className="flex-1 overflow-hidden p-4 bg-zinc-50">
                                            <FileExplorer
                                                onSelectFile={handleSourceSelect}
                                                onSelectFolder={() => { }}
                                                defaultView="grid"
                                                className="h-full bg-white border"
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-zinc-100">
                            <img
                                src={`/api/filesystem/image?path=${encodeURIComponent(sourceImage)}`}
                                alt="Source"
                                className="max-w-full max-h-full object-contain"
                            />

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="destructive" onClick={() => setSourceImage(null)}>
                                    <X className="h-4 w-4 mr-2" /> Clear Image
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function StudioModelSwapPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ModelSwapContent />
        </Suspense>
    );
}
