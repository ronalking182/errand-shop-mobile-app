import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";

const { height } = Dimensions.get("window");

export default function VerifiedScreen() {
  const { colors } = useTheme();

  const handleContinue = () => {
    // Expo Router: go to Profile tab
    router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "bottom"]}>
      {/* push the content down – tweak this if you want it lower/higher */}
      <View style={[styles.content, { marginTop: Math.max(48, height * 0.12) }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.brand }]}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Verified!</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>
          Your account has been successfully verified.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.brand }]}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Complete your profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    // don't center vertically; we want to control vertical offset ourselves
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkmark: { fontSize: 50, color: "white", fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 16, marginBottom: 28, textAlign: "center", lineHeight: 24, paddingHorizontal: 12 },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
