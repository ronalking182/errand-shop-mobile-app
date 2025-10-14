import { DarkTheme, DefaultTheme, ThemeProvider as NavTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import "../src/utils/polyfills";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { setupNotificationListeners } from '../src/services/notificationService';
import { useNotificationStore } from '../src/store/notification.store';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function NavBridge({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  return <NavTheme value={mode === "dark" ? DarkTheme : DefaultTheme}>{children}</NavTheme>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Remove the vector icon font loading as react-native-vector-icons handles this differently
  });
  
  const initializeNotifications = useNotificationStore(state => state.initializeNotifications);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);
  
  useEffect(() => {
    // Initialize notifications when app starts
    initializeNotifications();
    
    // Set up notification listeners
    const cleanup = setupNotificationListeners();
    
    return cleanup;
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavBridge>
          <Stack screenOptions={{ headerShown: false }} />
        </NavBridge>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
