import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo, useCallback } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import usePhotos from "../../hooks/usePhotos";

// Memoized photo item component for better performance
const PhotoItem = memo(({ item }) => (
	<Link
		href={{
			pathname: "/photo/[id]",
			params: {
				id: item.id,
				uri: item.uri,
				filename: item.filename,
				creationTime: item.creationTime,
			},
		}}
		asChild
	>
		<TouchableOpacity style={styles.photoItem}>
			<Image
				source={{ uri: item.uri }}
				style={styles.photoImage}
				resizeMode="cover"
			/>
		</TouchableOpacity>
	</Link>
));

PhotoItem.displayName = "PhotoItem";

// Add this function to check if items are the same
const areItemsEqual = (prevProps, nextProps) => {
	return prevProps.item.id === nextProps.item.id;
};

// Apply the comparison function to the memoized component
const MemoizedPhotoItem = memo(PhotoItem, areItemsEqual);

export default function GalleryScreen() {
	const { photos, isLoading, error, refetch } = usePhotos();

	// Use useCallback to memoize the renderItem function
	const renderItem = useCallback(
		({ item }) => <MemoizedPhotoItem item={item} />,
		[]
	);

	// Use useCallback for keyExtractor
	const keyExtractor = useCallback((item) => item.id, []);

	// Get the number of columns based on screen size
	const getNumColumns = useCallback(() => {
		return 3; // You can make this dynamic based on screen width
	}, []);

	if (isLoading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator size="large" color="#3498db" />
				<Text style={styles.loadingText}>Loading your photos...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centerContainer}>
				<Text style={styles.errorText}>Error: {error}</Text>
				<TouchableOpacity style={styles.retryButton} onPress={refetch}>
					<Text style={styles.retryText}>Try Again</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (photos.length === 0) {
		return (
			<View style={styles.centerContainer}>
				<Ionicons name="images" size={64} color="#bdc3c7" />
				<Text style={styles.emptyText}>No photos found</Text>
				<Text style={styles.emptySubtext}>
					Your photos will appear here
				</Text>
				<TouchableOpacity style={styles.retryButton} onPress={refetch}>
					<Text style={styles.retryText}>Refresh</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Text style={styles.headerTitle}>All Photos</Text>
					<Link href={"/settings"}>
						<Ionicons name="settings" size={28} color="#3498db" />
					</Link>
				</View>
				<Text style={styles.photoCount}>{photos.length} photos</Text>
			</View>

			<FlatList
				data={photos}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				numColumns={getNumColumns()}
				contentContainerStyle={styles.list}
				initialNumToRender={10} // Render only 10 items initially
				maxToRenderPerBatch={10} // Render 10 items at a time
				windowSize={5} // Reduce the window size
				removeClippedSubviews={true} // Remove items that are offscreen
				refreshControl={
					<RefreshControl
						refreshing={isLoading}
						onRefresh={refetch}
						colors={["#3498db"]}
						tintColor="#3498db"
					/>
				}
				getItemLayout={(data, index) => ({
					length: 100, // approximate height of your items
					offset: 100 * index,
					index,
				})}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		padding: 16,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#ecf0f1",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#2c3e50",
	},
	photoCount: {
		fontSize: 14,
		color: "#7f8c8d",
		marginTop: 4,
	},
	list: {
		padding: 2,
	},
	photoItem: {
		flex: 1,
		margin: 2,
		aspectRatio: 1,
	},
	photoImage: {
		width: "100%",
		height: "100%",
		borderRadius: 2,
	},
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#fff",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: "#7f8c8d",
	},
	errorText: {
		fontSize: 16,
		color: "#e74c3c",
		textAlign: "center",
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#2c3e50",
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#7f8c8d",
		textAlign: "center",
		marginBottom: 20,
	},
	retryButton: {
		padding: 12,
		backgroundColor: "#3498db",
		borderRadius: 8,
	},
	retryText: {
		color: "#fff",
		fontWeight: "bold",
	},
});
