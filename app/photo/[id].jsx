import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	GestureHandlerRootView,
	PinchGestureHandler,
	State,
	TapGestureHandler,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import GestureRecognizer from "react-native-swipe-gestures";
import usePhotoStore from "../hooks/usePhotoStore";
import usePhotos from "../hooks/usePhotos";

const { width, height } = Dimensions.get("window");

export default function PhotoScreen() {
	const { id } = useLocalSearchParams();
	const photos = usePhotoStore((s) => s.photos);
	const setPhotos = usePhotoStore((s) => s.setPhotos);

	const { getPhotos, hasNextPage } = usePhotos();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [isZoomed, setIsZoomed] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	// zoom refs
	const baseScale = useRef(new Animated.Value(1)).current;
	const pinchScale = useRef(new Animated.Value(1)).current;
	const scale = Animated.multiply(baseScale, pinchScale);
	const lastScale = useRef(1);
	const doubleTapRef = useRef();

	// Find initial index
	useEffect(() => {
		if (photos.length > 0 && id) {
			const index = photos.findIndex((p) => p.id === id);
			setCurrentIndex(index !== -1 ? index : 0);
		}
	}, [id, photos]);

	// Lazy load next page if user scrolls near the end
	const onMomentumScrollEnd = async (ev) => {
		const index = Math.round(ev.nativeEvent.contentOffset.x / width);
		setCurrentIndex(index);
		resetZoom();

		// If near the end and more photos exist, fetch next page
		if (index >= photos.length - 3 && hasNextPage && !loadingMore) {
			setLoadingMore(true);
			const newPhotos = await getPhotos(); // fetch next batch
			setPhotos([...photos, ...newPhotos]); // append to store
			setLoadingMore(false);
		}
	};

	const onPinchGestureEvent = Animated.event(
		[{ nativeEvent: { scale: pinchScale } }],
		{ useNativeDriver: true }
	);

	const onPinchHandlerStateChange = (event) => {
		if (event.nativeEvent.oldState === State.ACTIVE) {
			let newScale = lastScale.current * event.nativeEvent.scale;
			newScale = Math.max(1, Math.min(newScale, 4));
			baseScale.setValue(newScale);
			pinchScale.setValue(1);
			lastScale.current = newScale;
			setIsZoomed(newScale > 1.1);
		}
	};

	const onDoubleTap = (event) => {
		if (event.nativeEvent.state === State.ACTIVE) {
			const targetScale = isZoomed ? 1 : 2.5;
			Animated.spring(baseScale, {
				toValue: targetScale,
				useNativeDriver: true,
				damping: 15,
			}).start();
			lastScale.current = targetScale;
			setIsZoomed(!isZoomed);
		}
	};

	const resetZoom = () => {
		Animated.spring(baseScale, {
			toValue: 1,
			useNativeDriver: true,
		}).start();
		pinchScale.setValue(1);
		lastScale.current = 1;
		setIsZoomed(false);
	};

	const safeBack = () => {
		if (router.canGoBack()) router.back();
		else router.replace("/");
	};

	const handleBottomSwipe = (event) => {
		if (event === "SWIPE_DOWN") safeBack();
	};

	if (!photos || photos.length === 0) {
		return (
			<View style={styles.centerContainer}>
				<Ionicons name="alert-circle" size={64} color="#fff" />
				<Text style={styles.errorText}>No photos found</Text>
				<TouchableOpacity style={styles.backButton} onPress={safeBack}>
					<Ionicons name="arrow-back" size={24} color="#fff" />
					<Text style={styles.backText}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaView style={styles.container}>
				{/* Top bar */}
				<View style={styles.topControls}>
					<TouchableOpacity
						style={styles.controlButton}
						onPress={safeBack}
					>
						<Ionicons name="arrow-back" size={24} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.photoCounter}>
						{currentIndex + 1} / {photos.length}
					</Text>
					<TouchableOpacity
						style={styles.controlButton}
						onPress={() => setShowInfo(!showInfo)}
					>
						<Ionicons
							name={
								showInfo ? "information" : "information-outline"
							}
							size={24}
							color="#fff"
						/>
					</TouchableOpacity>
				</View>

				{/* FlatList swipe gallery */}
				<FlatList
					data={photos}
					keyExtractor={(item) => item.id}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					initialScrollIndex={currentIndex}
					getItemLayout={(data, index) => ({
						length: width,
						offset: width * index,
						index,
					})}
					onMomentumScrollEnd={onMomentumScrollEnd}
					renderItem={({ item }) => (
						<View
							style={{
								width,
								height,
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<PinchGestureHandler
								onGestureEvent={onPinchGestureEvent}
								onHandlerStateChange={onPinchHandlerStateChange}
							>
								<Animated.View style={{ flex: 1 }}>
									<TapGestureHandler
										ref={doubleTapRef}
										onHandlerStateChange={onDoubleTap}
										numberOfTaps={2}
									>
										<GestureRecognizer
											onSwipe={handleBottomSwipe}
										>
											<Animated.Image
												source={{ uri: item.uri }}
												style={[
													styles.photo,
													{ transform: [{ scale }] },
												]}
												resizeMode={
													isZoomed
														? "cover"
														: "contain"
												}
											/>
										</GestureRecognizer>
									</TapGestureHandler>
								</Animated.View>
							</PinchGestureHandler>
						</View>
					)}
				/>

				{/* Reset zoom button */}
				{isZoomed && (
					<TouchableOpacity
						style={styles.zoomButton}
						onPress={resetZoom}
					>
						<Ionicons name="scan-outline" size={20} color="#fff" />
						<Text style={styles.zoomText}>Reset Zoom</Text>
					</TouchableOpacity>
				)}

				{/* Info overlay */}
				{showInfo && photos[currentIndex] && (
					<View style={styles.infoBox}>
						<Text style={styles.infoText}>
							{photos[currentIndex].filename}
						</Text>
						<Text style={styles.infoText}>
							{photos[currentIndex].width} ×{" "}
							{photos[currentIndex].height}
						</Text>
					</View>
				)}
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#000" },
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#000",
	},
	errorText: {
		color: "#fff",
		fontSize: 18,
		marginVertical: 20,
		textAlign: "center",
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 20,
		padding: 10,
		marginTop: 10,
	},
	backText: { color: "#fff", marginLeft: 10 },
	topControls: {
		position: "absolute",
		top: 50,
		right: 0,
		left: 0,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		zIndex: 10,
	},
	bottomControls: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "space-around",
		paddingHorizontal: 20,
		paddingBottom: 10,
		zIndex: 10,
	},
	controlButton: {
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 20,
		padding: 10,
	},
	photoCounter: { color: "#fff", fontSize: 16, fontWeight: "500" },
	photo: { width, height: height * 0.9 },
	zoomButton: {
		position: "absolute",
		bottom: 80,
		alignSelf: "center",
		flexDirection: "row",
		backgroundColor: "rgba(0,0,0,0.7)",
		padding: 10,
		borderRadius: 8,
	},
	zoomText: { color: "#fff", marginLeft: 5 },
	infoBox: {
		position: "absolute",
		bottom: 70,
		left: 20,
		right: 20,
		backgroundColor: "rgba(0,0,0,0.7)",
		padding: 10,
		borderRadius: 8,
	},
	infoText: { color: "#fff", fontSize: 14 },
});
