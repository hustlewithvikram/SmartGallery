import { create } from "zustand";
import { Photo } from "../hooks/usePhotos"; // your Photo type

interface PhotoStore {
	photos: Photo[];
	endCursor: string | null;
	hasNextPage: boolean;
	isLoading: boolean;
	isLoadingMore: boolean;
	setPhotos: (photos: Photo[]) => void;
	appendPhotos: (photos: Photo[]) => void;
	setEndCursor: (cursor: string | null) => void;
	setHasNextPage: (hasNext: boolean) => void;
	setIsLoading: (loading: boolean) => void;
	setIsLoadingMore: (loading: boolean) => void;
}

const usePhotoStore = create<PhotoStore>((set) => ({
	photos: [],
	endCursor: null,
	hasNextPage: true,
	isLoading: true,
	isLoadingMore: false,
	setPhotos: (photos) => set({ photos }),
	appendPhotos: (photos) =>
		set((state) => ({ photos: [...state.photos, ...photos] })),
	setEndCursor: (cursor) => set({ endCursor: cursor }),
	setHasNextPage: (hasNext) => set({ hasNextPage: hasNext }),
	setIsLoading: (loading) => set({ isLoading: loading }),
	setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
}));

export default usePhotoStore;
