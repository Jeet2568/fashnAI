import { create } from 'zustand';

interface StoreState {
    selectedFolder: string;
    setSelectedFolder: (folder: string) => void;
}

export const useStore = create<StoreState>((set) => ({
    selectedFolder: "",
    setSelectedFolder: (folder) => set({ selectedFolder: folder }),
}));
