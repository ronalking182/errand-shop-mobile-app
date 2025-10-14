import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";

export default function PasswordUpdatedScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={{ padding: 16, alignItems: "center" }}>
        <View style={[styles.bigIcon, { backgroundColor: "#E8FFF0" }]}>
          <Text style={{ color: "#22C55E", fontSize: 28 }}>✓</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Password Updated</Text>
        <Text style={[styles.sub, { color: colors.sub }]}>
          Your account is now secure with your new password
        </Text>

        <Text style={[styles.success, { color: colors.text }]}>Success!</Text>
        <Text style={[styles.sub, { color: colors.sub, marginTop: 4, textAlign: "center" }]}>
          You can now log in with your new password.
        </Text>

        <Pressable onPress={() => router.replace("/login")} style={[styles.primary, { backgroundColor: colors.brand }]}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Log In Now</Text>
        </Pressable>

        <View style={[styles.info, { backgroundColor: "#EEF3FF" }]}>
          <Text>🛈 Having trouble logging in? Contact our support team for assistance.</Text>
        </View>

        <Text style={{ color: colors.sub, fontSize: 12, marginTop: 10 }}>
          🔒 Your information is secure with Errand Shop
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center" },
  bigIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", marginTop: 12 },
  sub: { marginTop: 6, textAlign: "center" },
  success: { marginTop: 18, fontWeight: "900", fontSize: 18 },
  primary: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 16, alignSelf: "stretch" },
  info: { marginTop: 12, padding: 12, borderRadius: 10, alignSelf: "stretch" },
});
