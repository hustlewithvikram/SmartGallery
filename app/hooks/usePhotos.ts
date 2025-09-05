import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";

// A simplified Photo type you can use across the app
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

	const getPermission = async (): Promise<boolean> => {
		try {
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
		} catch (err: any) {
			setError(err.message || "Permission error");
			return false;
		}
	};

	const getPhotos = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const hasPermission = await getPermission();
			if (!hasPermission) {
				setError("Photo permission not granted");
				setIsLoading(false);
				return;
			}

			let allPhotos: Photo[] = [];
			let hasNextPage = true;
			let endCursor: string | null = null;
			let attemptCount = 0;
			const maxAttempts = 3;

			while (
				hasNextPage &&
				allPhotos.length < 200 &&
				attemptCount < maxAttempts
			) {
				try {
					const media = await MediaLibrary.getAssetsAsync({
						first: 50,
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

					allPhotos = [...allPhotos, ...mapped];
					hasNextPage = media.hasNextPage;
					endCursor = media.endCursor;
					attemptCount = 0;
				} catch (chunkError) {
					attemptCount++;
					console.warn(
						`Failed to load photo chunk, attempt ${attemptCount}:`,
						chunkError
					);

					if (attemptCount >= maxAttempts) {
						throw new Error(
							"Failed to load photos after multiple attempts"
						);
					}
				}
			}

			setPhotos(allPhotos);

			try {
				const albumList = await MediaLibrary.getAlbumsAsync();
				setAlbums(albumList);
			} catch (albumError) {
				console.log("Album access not available:", albumError);
			}
		} catch (err: any) {
			console.error("Error loading photos:", err);
			setError(err.message || "Failed to load photos");
			setPhotos(generateFallbackPhotos());
		} finally {
			setIsLoading(false);
		}
	};

	const generateFallbackPhotos = (): Photo[] =>
		Array.from({ length: 20 }, (_, i) => ({
			id: `${i + 1}`,
			uri: `https://picsum.photos/400/400?random=${i + 1}`,
			filename: `photo-${i + 1}.jpg`,
			creationTime: Date.now() - i * 1000000000,
			width: 400,
			height: 400,
		}));

	useEffect(() => {
		getPhotos();
	}, []);

	return {
		photos,
		albums,
		permission,
		isLoading,
		error,
		refetch: getPhotos,
	};
}
