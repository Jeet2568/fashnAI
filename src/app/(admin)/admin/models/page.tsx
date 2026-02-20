"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "sonner";
import { runModelGen, saveGeneratedModel } from "./actions"; // Wait, need to create actions first or reference correctly
import { Loader2, Sparkles, Save, Trash2, ScanFace, FileImage } from "lucide-react";

interface ModelResource {
    id: string;
    name: string;
    thumbnail: string;
}

export default function ModelsPage() {
    // Inputs
    const [faceImage, setFaceImage] = useState<string>("");
    const [poseImage, setPoseImage] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [ratio, setRatio] = useState<string>("3:4");
    const [quality, setQuality] = useState<string>("balanced");

    // State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [saveName, setSaveName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Gallery
    const [models, setModels] = useState<ModelResource[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const res = await fetch("/api/resources?type=model");
            if (res.ok) {
                const data = await res.json();
                setModels(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleGenerate = async () => {
        if (!faceImage || !poseImage) {
            toast.error("Please upload both Face and Pose references.");
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const fd = new FormData();
            fd.append("faceImage", faceImage);
            fd.append("poseImage", poseImage);
            fd.append("prompt", prompt);
            fd.append("ratio", ratio);
            fd.append("quality", quality);
            fd.append("numImages", "1");

            // We need to import the server action. 
            // In Next.js client component, we import it from a separate file 'actions.ts'.
            // I'll assume 'runModelGen' is imported.

            // Since I haven't defined the import path in this file content block yet (I will in the tool call)
            // Let's assume standard import.

            // NOTE: In the write_to_file tool call I will ensure correct imports.

            const result: any = await runModelGen(fd);

            if (result.success && result.urls && result.urls.length > 0) {
                setGeneratedImage(result.urls[0]);
                toast.success("Model Generated!");
            } else {
                throw new Error(result.error || "Generation failed");
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedImage || !saveName) {
            toast.error("Please ensure image is generated and name is provided.");
            return;
        }

        setIsSaving(true);
        try {
            const result: any = await saveGeneratedModel(generatedImage, saveName);
            if (result.success) {
                toast.success("Model Saved to Resources!");
                setSaveName("");
                setGeneratedImage(null); // Clear after save? Or keep?
                fetchModels(); // Refresh gallery
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this model?")) return;
        try {
            await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
            setModels(models.filter(m => m.id !== id));
            toast.success("Model deleted");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="p-6 space-y-8 h-full flex flex-col overflow-hidden bg-background">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Model Studio</h1>
                    <p className="text-muted-foreground">Generate custom AI models from face and pose references.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">

                {/* Left: Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generator Inputs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Face Ref */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <ScanFace className="h-4 w-4" /> Face Reference (Identity)
                                </Label>
                                <FileUploader
                                    value={faceImage}
                                    onValueChange={setFaceImage}
                                    folder="_temp/faces"
                                    className="h-40"
                                    label="Upload Face"
                                />
                            </div>

                            {/* Pose Ref */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <FileImage className="h-4 w-4" /> Pose Reference (Body/Clothes)
                                </Label>
                                <FileUploader
                                    value={poseImage}
                                    onValueChange={setPoseImage}
                                    folder="_temp/poses"
                                    className="h-40"
                                    label="Upload Pose"
                                />
                            </div>

                            {/* Settings */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ratio</Label>
                                    <Select value={ratio} onValueChange={setRatio}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3:4">3:4 Portrait</SelectItem>
                                            <SelectItem value="1:1">1:1 Square</SelectItem>
                                            <SelectItem value="9:16">9:16 Story</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quality</Label>
                                    <Select value={quality} onValueChange={setQuality}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="balanced">Balanced</SelectItem>
                                            <SelectItem value="creative">Creative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Edit Prompt (Optional)</Label>
                                <Textarea
                                    placeholder="Describe lighting, changes, etc."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleGenerate}
                                disabled={isGenerating || !faceImage || !poseImage}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" /> Generate Model
                                    </>
                                )}
                            </Button>

                        </CardContent>
                    </Card>
                </div>

                {/* Right: Preview & Gallery */}
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">

                    {/* Preview Area */}
                    <Card className="flex-1 flex flex-col min-h-[400px]">
                        <CardHeader className="pb-2">
                            <CardTitle>Generated Result</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <div className="flex-1 bg-muted/20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative">
                                {generatedImage ? (
                                    <img src={generatedImage} alt="Result" className="h-full w-full object-contain" />
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                                        <Sparkles className="h-10 w-10 opacity-20" />
                                        <p>Result will appear here</p>
                                    </div>
                                )}
                            </div>

                            {generatedImage && (
                                <div className="flex gap-4 items-end pt-2">
                                    <div className="flex-1 space-y-2">
                                        <Label>Model Name</Label>
                                        <Input
                                            placeholder="e.g. Blonde Summer Model"
                                            value={saveName}
                                            onChange={(e) => setSaveName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleSave} disabled={isSaving || !saveName}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save to Models
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Existing Models Gallery */}
                    <div className="h-[250px] shrink-0 flex flex-col gap-3">
                        <Label className="text-lg font-semibold">Your Saved Models</Label>
                        <div className="flex-1 overflow-x-auto whitespace-nowrap pb-4">
                            <div className="flex gap-4 h-full">
                                {isLoadingModels ? (
                                    // Skeletons
                                    [1, 2, 3, 4].map(i => <div key={i} className="w-[180px] h-full bg-muted animate-pulse rounded-lg" />)
                                ) : models.length > 0 ? (
                                    models.map(model => (
                                        <div key={model.id} className="w-[180px] h-full relative group rounded-lg overflow-hidden border bg-card">
                                            <img src={model.thumbnail} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <p className="text-white font-medium truncate text-sm">{model.name}</p>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 mt-2"
                                                    onClick={() => handleDelete(model.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                        No saved models yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

// Server Action Imports (Mocked for Write, will be resolved by bundler)
// In real Next.js structure, this file would import from ./actions
