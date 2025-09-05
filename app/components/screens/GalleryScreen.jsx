import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo, useCallback, useState } from "react";
import {
	Dimensions,
	FlatList,
	Image,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import usePhotoStore from "../../hooks/usePhotoStore";
import usePhotos from "../../hooks/usePhotos";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const IMAGE_SIZE = (width - (COLUMN_COUNT + 1) * 2) / COLUMN_COUNT; // margin included

// Memoized photo item
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
				source={{ uri: item.thumbnailUri || item.uri }}
				style={styles.photoImage}
				resizeMode="cover"
			/>
		</TouchableOpacity>
	</Link>
));

PhotoItem.displayName = "PhotoItem";
const areItemsEqual = (prevProps, nextProps) =>
	prevProps.item.id === nextProps.item.id;
const MemoizedPhotoItem = memo(PhotoItem, areItemsEqual);

// Skeleton placeholder
const SkeletonItem = () => <View style={styles.skeletonItem} />;

export default function GalleryScreen() {
	const photos = usePhotoStore((s) => s.photos);
	const setPhotos = usePhotoStore((s) => s.setPhotos);
	const { getPhotos, isLoading, error, refetch } = usePhotos();

	const [page, setPage] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);

	// Load next page with throttling
	const loadNextPage = useCallback(async () => {
		if (loadingMore) return;
		setLoadingMore(true);
		const newPhotos = await getPhotos(page + 1); // page param handled inside hook
		if (newPhotos && newPhotos.length > 0) {
			setPhotos([...photos, ...newPhotos]);
			setPage((prev) => prev + 1);
		}
		setLoadingMore(false);
	}, [loadingMore, page, photos, setPhotos, getPhotos]);

	const renderItem = useCallback(
		({ item }) =>
			item.id.startsWith("skeleton") ? (
				<SkeletonItem />
			) : (
				<MemoizedPhotoItem item={item} />
			),
		[]
	);
	const keyExtractor = useCallback((item) => item.id, []);
	const getNumColumns = useCallback(() => COLUMN_COUNT, []);

	// Skeletons for initial load
	const skeletons = Array.from({ length: 15 }).map((_, i) => ({
		id: `skeleton-${i}`,
	}));

	const dataToRender = isLoading && page === 0 ? skeletons : photos;

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerRow}>
					<Text style={styles.headerTitle}>All Photos</Text>
					<Link href={"/settings"}>
						<Ionicons name="settings" size={28} color="#3498db" />
					</Link>
				</View>
				<Text style={styles.photoCount}>
					{isLoading && page === 0
						? "Loading..."
						: `${photos.length} photos`}
				</Text>
			</View>

			{error && (
				<View style={styles.centerContainer}>
					<Text style={styles.errorText}>Error: {error}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={refetch}
					>
						<Text style={styles.retryText}>Try Again</Text>
					</TouchableOpacity>
				</View>
			)}

			<FlatList
				data={dataToRender}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				numColumns={getNumColumns()}
				contentContainerStyle={styles.list}
				initialNumToRender={15}
				maxToRenderPerBatch={12}
				windowSize={5}
				removeClippedSubviews
				refreshControl={
					<RefreshControl
						refreshing={isLoading && page === 0}
						onRefresh={refetch}
						colors={["#3498db"]}
						tintColor="#3498db"
					/>
				}
				onEndReached={loadNextPage}
				onEndReachedThreshold={0.5}
				ListFooterComponent={loadingMore ? <SkeletonItem /> : null}
				getItemLayout={(data, index) => ({
					length: IMAGE_SIZE + 4, // 2px margin on each side
					offset: index * (IMAGE_SIZE + 4),
					index,
				})}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#fff" },
	header: {
		padding: 16,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#ecf0f1",
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	headerTitle: { fontSize: 24, fontWeight: "bold", color: "#2c3e50" },
	photoCount: { fontSize: 14, color: "#7f8c8d", marginTop: 4 },
	list: { padding: 2 },
	photoItem: { width: IMAGE_SIZE, height: IMAGE_SIZE, margin: 2 },
	photoImage: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 2 },
	skeletonItem: {
		width: IMAGE_SIZE,
		height: IMAGE_SIZE,
		margin: 2,
		borderRadius: 2,
		backgroundColor: "#e0e0e0",
	},
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#fff",
	},
	errorText: {
		fontSize: 16,
		color: "#e74c3c",
		textAlign: "center",
		marginBottom: 16,
	},
	retryButton: { padding: 12, backgroundColor: "#3498db", borderRadius: 8 },
	retryText: { color: "#fff", fontWeight: "bold" },
});
