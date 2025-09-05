import { create } from "zustand";

const usePhotoStore = create((set) => ({
    photos: [],
    setPhotos: (photos) => set({ photos }),
}));

export default usePhotoStore;
