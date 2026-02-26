import { create } from 'zustand';

export interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface TryOnState {
    // Composer State
    prompt: string;
    prompts: string[]; // Batch prompts (4 slots)
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "2:3" | "3:2" | "4:5" | "5:4" | "4:1";
    numImages: number;

    // Feature Toggles
    useFaceReference: boolean;
    useImagePrompt: boolean;
    useBackgroundReference: boolean;
    nsfwFilter: boolean;
    coverMessedFeet: boolean;
    adjustHands: boolean;
    restoreBackground: boolean;
    restoreClothes: boolean;

    // Category & Type
    category: "tops" | "bottoms" | "one-pieces";
    garmentPhotoType: "auto" | "model" | "flat-lay";

    // Fine Tuning (Sliders)
    creativity: number;
    resemblance: number;
    structureMatch: number;
    quality: "hd" | "precise" | "balanced" | "creative";

    // Advanced
    seed: string;
    num_inference_steps: number;
    guidance_scale: number;

    // Selection State
    selectedFolder: string;
    selectedModel: FileEntry | null;
    selectedGarments: FileEntry[];
    selectedBackground: FileEntry | null;

    // Images (Mapped from selection)
    garment_image: FileEntry | null;
    model_image: FileEntry | null;
    background_image: FileEntry | null;

    // Actions
    setPrompt: (prompt: string) => void;
    setPrompts: (prompts: string[]) => void;
    setCategory: (category: "tops" | "bottoms" | "one-pieces") => void;
    setFolder: (path: string) => void;
    setModel: (file: FileEntry | null) => void;
    setGarments: (files: FileEntry[]) => void;
    setBackground: (file: FileEntry | null) => void;
    setParam: (key: keyof Omit<TryOnState, "setPrompt" | "setPrompts" | "setCategory" | "setFolder" | "setModel" | "setGarments" | "setBackground" | "setParam" | "reset">, value: any) => void;
    reset: () => void;
}

export const useTryOnStore = create<TryOnState>((set) => ({
    // Defaults
    prompt: "",
    prompts: ["", "", "", ""],
    aspectRatio: "3:4",
    numImages: 1,

    useFaceReference: true,
    useImagePrompt: false,
    useBackgroundReference: false,
    nsfwFilter: true,
    coverMessedFeet: false,
    adjustHands: false,
    restoreBackground: false,
    restoreClothes: false,

    category: "tops",
    garmentPhotoType: "auto",

    creativity: 0.7,
    resemblance: 0.9,
    structureMatch: 0.9,
    quality: "hd",

    seed: "",
    num_inference_steps: 30,
    guidance_scale: 2.5,

    // Initial State
    selectedFolder: "",
    selectedModel: null,
    selectedGarments: [],
    selectedBackground: null,

    garment_image: null,
    model_image: null,
    background_image: null,

    // Setters
    setPrompt: (prompt) => set({ prompt }),
    setPrompts: (prompts) => set({ prompts }),
    setCategory: (category) => set({ category }),
    setFolder: (path) => set({ selectedFolder: path }),
    setModel: (file) => set({ selectedModel: file, model_image: file }),
    setGarments: (files) => set({ selectedGarments: files, garment_image: files[0] || null }), // Default raw mapping
    setBackground: (file) => {
        set({ selectedBackground: file, background_image: file });
        if (file) set({ useBackgroundReference: true });
    },
    setParam: (key, value) => set((state) => ({ ...state, [key]: value })),

    reset: () => set({
        prompt: "",
        prompts: ["", "", "", ""],
        aspectRatio: "3:4",
        numImages: 1,

        useFaceReference: true,
        useImagePrompt: false,
        useBackgroundReference: false,
        nsfwFilter: true,
        coverMessedFeet: false,
        adjustHands: false,
        restoreBackground: false,
        restoreClothes: false,

        category: "tops",
        garmentPhotoType: "auto",

        creativity: 0.7,
        resemblance: 0.9,
        structureMatch: 0.9,
        quality: "hd",
        seed: "",
        num_inference_steps: 30,
        guidance_scale: 2.5,

        selectedFolder: "",
        selectedModel: null,
        selectedGarments: [],
        selectedBackground: null,
        garment_image: null,
        model_image: null,
        background_image: null,
    }),
}));
