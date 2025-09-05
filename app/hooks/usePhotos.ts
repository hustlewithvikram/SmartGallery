import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";

export type Photo = {
	id: string;
	uri: string;
	filename?: string;
	width: number;
	height: number;
	creationTime?: number;
};

export default function usePhotos() {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
	const [permission, setPermission] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Keep track of pagination
	const [endCursor, setEndCursor] = useState<string | null>(null);
	const [hasNextPage, setHasNextPage] = useState(true);

	const getPermission = async (): Promise<boolean> => {
		const { status, canAskAgain } =
			await MediaLibrary.getPermissionsAsync();
		if (status === "undetermined" || canAskAgain) {
			const { status: newStatus } =
				await MediaLibrary.requestPermissionsAsync();
			setPermission(newStatus);
			return newStatus === "granted";
		}
		setPermission(status);
		return status === "granted";
	};

	const getPhotos = async (pageSize = 50) => {
		try {
			const hasPermission = await getPermission();
			if (!hasPermission) {
				setError("Photo permission not granted");
				return [];
			}

			if (!hasNextPage) return []; // nothing more to load

			const media = await MediaLibrary.getAssetsAsync({
				first: pageSize,
				after: endCursor || undefined,
				mediaType: MediaLibrary.MediaType.photo,
				sortBy: [MediaLibrary.SortBy.creationTime],
			});

			const mapped = media.assets.map((asset) => ({
				id: asset.id,
				uri: asset.uri,
				filename: asset.filename,
				width: asset.width,
				height: asset.height,
				creationTime: asset.creationTime,
			}));

			// Update state for pagination
			setEndCursor(media.endCursor);
			setHasNextPage(media.hasNextPage);

			// Add to existing photos
			setPhotos((prev) => [...prev, ...mapped]);

			// Load albums once
			if (albums.length === 0) {
				const albumList = await MediaLibrary.getAlbumsAsync();
				setAlbums(albumList);
			}

			return mapped;
		} catch (err: any) {
			setError(err.message || "Failed to load photos");
			return [];
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setIsLoading(true);
		getPhotos();
	}, []);

	const refetch = async () => {
		setPhotos([]);
		setEndCursor(null);
		setHasNextPage(true);
		setIsLoading(true);
		await getPhotos();
	};

	return {
		photos,
		albums,
		permission,
		isLoading,
		error,
		getPhotos,
		refetch,
		hasNextPage,
	};
}
