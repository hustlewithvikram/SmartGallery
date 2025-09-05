import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import GalleryScreen from "./components/screens/GalleryScreen";
import usePhotoStore from "./hooks/usePhotoStore";
import usePhotos from "./hooks/usePhotos";

export default function HomeScreen() {
	const { photos } = usePhotos(); // fetch first page
	const setPhotos = usePhotoStore((state) => state.setPhotos);

	useEffect(() => {
		if (photos.length > 0) {
			setPhotos(photos); // directly set fetched photos into the store
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
		flex: 1,
		width: "100%",
		height: "100%",
	},
});
