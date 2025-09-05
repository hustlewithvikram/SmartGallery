import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import GalleryScreen from "./components/screens/GalleryScreen";
import usePhotoStore from "./hooks/usePhotoStore.js";
import usePhotos from "./hooks/usePhotos";

export default function HomeScreen() {
	const { photos, refetch } = usePhotos();
	const setPhotos = usePhotoStore((s) => s.setPhotos);

	useEffect(() => {
		if (photos.length > 0) {
			const mapped = photos.map((asset) => ({
				id: asset.id,
				uri: asset.uri,
				filename: asset.filename,
				width: asset.width,
				height: asset.height,
			}));
			setPhotos(mapped);
		}
	}, [photos]);

	return (
		<View style={styles.container}>
			<GalleryScreen />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		height: "100%",
		width: "100%",
	},
});
