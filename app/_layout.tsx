import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<Stack
					screenOptions={{
						headerStyle: {
							backgroundColor: "#2c3e50",
						},
						headerTintColor: "#fff",
						headerTitleStyle: {
							fontWeight: "bold",
						},
						contentStyle: {
							backgroundColor: "#ecf0f1",
						},
					}}
				>
					<Stack.Screen
						name="index"
						options={{
							title: "Smart Gallery",
							headerShown: false,
						}}
					/>
					<Stack.Screen
						name="gallery"
						options={{
							title: "All Photos",
							presentation: "card",
						}}
					/>
					<Stack.Screen
						name="album/[id]"
						options={{
							title: "Album",
							presentation: "card",
						}}
					/>
					<Stack.Screen
						name="photo/[id]"
						options={{
							title: "Photo",
							headerShown: false,
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="settings"
						options={{
							title: "Settings",
							presentation: "card",
						}}
					/>
				</Stack>
				<StatusBar style="inverted" />
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
