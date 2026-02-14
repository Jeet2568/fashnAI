import { create } from 'zustand';

export interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface TryOnState {
    // Composer State
    prompt: string;
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "2:3" | "3:2" | "4:5" | "5:4";
    numImages: number;

    // Feature Toggles
    useFaceReference: boolean;
    useImagePrompt: boolean;
    useBackgroundReference: boolean;

    // Category & Type
    category: "tops" | "bottoms" | "one-pieces";
    garmentPhotoType: "auto" | "model" | "flat-lay";

    // Fine Tuning (Sliders)
    creativity: number;
    resemblance: number;
    structureMatch: number;
    quality: "precise" | "balanced" | "creative";

    // Selection State
    selectedFolder: string;
    selectedModel: FileEntry | null;
    selectedGarments: FileEntry[]; // Changed from single to array
    selectedBackground: FileEntry | null;

    // Global Config (Applied to all unless overridden)
    // Actions
    setFolder: (path: string) => void;
    setModel: (file: FileEntry | null) => void;
    setGarments: (files: FileEntry[]) => void;
    setBackground: (file: FileEntry | null) => void;
    setParam: (key: keyof Omit<TryOnState, "batchItems">, value: any) => void;
    reset: () => void;
}

export const useTryOnStore = create<TryOnState>((set) => ({
    // Defaults
    prompt: "",
    aspectRatio: "3:4",
    numImages: 1,

    useFaceReference: true,
    useImagePrompt: false,
    useBackgroundReference: false,

    category: "tops",
    garmentPhotoType: "auto",

    creativity: 0.7,
    resemblance: 0.9,
    structureMatch: 0.9,
    quality: "balanced",

    // Initial State
    selectedFolder: "",
    selectedModel: null,
    selectedGarments: [],
    selectedBackground: null,

    // Config Defaults
    setParam: (key, value) => set((state) => ({ ...state, [key]: value })),
    // Setters
    setFolder: (path) => set({ selectedFolder: path }),
    setModel: (file) => set({ selectedModel: file }),
    setGarments: (files) => set({ selectedGarments: files }),
    setBackground: (file) => {
        set({ selectedBackground: file });
        if (file) set({ useBackgroundReference: true });
    },

    reset: () => set({
        prompt: "",
        aspectRatio: "3:4",
        numImages: 1,

        useFaceReference: true,
        useImagePrompt: false,
        useBackgroundReference: false,

        category: "tops",
        garmentPhotoType: "auto",

        creativity: 0.7,
        resemblance: 0.9,
        structureMatch: 0.9,
        quality: "balanced",

        selectedFolder: "",
        selectedModel: null,
        selectedGarments: [],
        selectedBackground: null,
    }),
}));
