import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/auth.store";


export default function SplashScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { loadUser } = useAuthStore();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Show splash for at least 800ms
        await new Promise(r => setTimeout(r, 800));

        console.log('🚀 Initializing app authentication...');
        
        // Load user authentication state into the auth store
        await loadUser();
        console.log('✅ Auth state loaded into store');

        // Check authentication and onboarding status
        const [isLoggedIn, hasSeenOnboarding] = await Promise.all([
          authService.isLoggedIn(),
          authService.hasSeenOnboarding()
        ]);

        console.log('🔐 Auth check results:', { isLoggedIn, hasSeenOnboarding });

        if (navigation) {
          if (isLoggedIn) {
            // User is logged in, go to home
            console.log('✅ User authenticated, navigating to home');
            return navigation.replace("Home");
          } else if (hasSeenOnboarding) {
            // User has seen onboarding but not logged in, go to login
            console.log('👋 User seen onboarding, navigating to login');
            return navigation.replace("Login");
          } else {
            // First time user, show onboarding
            console.log('🆕 First time user, showing onboarding');
            return navigation.replace("Onboarding");
          }
        }
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        // Fallback to onboarding on error
        if (navigation) navigation.replace("Onboarding");
      }
    };
    
    initializeApp();
  }, [navigation, loadUser]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Image
        source={require("../../../assets/images/logo.png")}
        style={{ width: 220, height: 70 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
