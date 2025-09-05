import * as MediaLibrary from "expo-media-library";
import { useEffect } from "react";
import usePhotoStore from "./usePhotoStore";
import { Photo } from "./usePhotos";

export default function usePaginatedPhotos() {
	const {
		photos,
		endCursor,
		hasNextPage,
		isLoading,
		isLoadingMore,
		setPhotos,
		appendPhotos,
		setEndCursor,
		setHasNextPage,
		setIsLoading,
		setIsLoadingMore,
	} = usePhotoStore();

	const getPermission = async (): Promise<boolean> => {
		const { status, canAskAgain } =
			await MediaLibrary.getPermissionsAsync();
		if (status === "undetermined" || canAskAgain) {
			const { status: newStatus } =
				await MediaLibrary.requestPermissionsAsync();
			return newStatus === "granted";
		}
		return status === "granted";
	};

	const getPhotos = async () => {
		setIsLoading(true);
		const hasPermission = await getPermission();
		if (!hasPermission) {
			setIsLoading(false);
			return;
		}

		const media = await MediaLibrary.getAssetsAsync({
			first: 50,
			mediaType: MediaLibrary.MediaType.photo,
			sortBy: [MediaLibrary.SortBy.creationTime],
		});

		const mapped: Photo[] = media.assets.map((asset) => ({
			id: asset.id,
			uri: asset.uri,
			filename: asset.filename,
			width: asset.width,
			height: asset.height,
			creationTime: asset.creationTime,
		}));

		setPhotos(mapped);
		setHasNextPage(media.hasNextPage);
		setEndCursor(media.endCursor);
		setIsLoading(false);
	};

	const loadMore = async () => {
		if (!hasNextPage || isLoadingMore) return;
		setIsLoadingMore(true);

		const media = await MediaLibrary.getAssetsAsync({
			first: 50,
			after: endCursor || undefined,
			mediaType: MediaLibrary.MediaType.photo,
			sortBy: [MediaLibrary.SortBy.creationTime],
		});

		const mapped: Photo[] = media.assets.map((asset) => ({
			id: asset.id,
			uri: asset.uri,
			filename: asset.filename,
			width: asset.width,
			height: asset.height,
			creationTime: asset.creationTime,
		}));

		appendPhotos(mapped);
		setHasNextPage(media.hasNextPage);
		setEndCursor(media.endCursor);
		setIsLoadingMore(false);
	};

	useEffect(() => {
		if (photos.length === 0) getPhotos();
	}, []);

	return { photos, isLoading, isLoadingMore, loadMore };
}
