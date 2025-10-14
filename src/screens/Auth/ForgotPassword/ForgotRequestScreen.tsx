import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Alert, ActivityIndicator } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { apiService } from "../../../services/apiService";

export default function ForgotRequestScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendLink = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.forgotPassword(email);
      
      if (response.success) {
        Alert.alert(
          "Success",
          response.message || "Password reset email sent",
          [{ text: "OK", onPress: () => router.push("/forgot/verify") }]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to send reset email");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to send reset email";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* header stub */}
      <Pressable style={[styles.hBack, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()}>
        <Text style={{ color: colors.text }}>← Back to Login</Text>
      </Pressable>

      <View style={{ padding: 16 }}>
        {/* icon pill */}
        <View style={[styles.iconPill, { backgroundColor: "#FFF1ED" }]} />
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
        <Text style={[styles.sub, { color: colors.sub }]}>
          Enter your email address and we'll send you a 6-digit code to reset your password
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email Address"
          placeholderTextColor={colors.sub}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
        />

        <Pressable 
          onPress={sendLink} 
          style={[styles.primary, { backgroundColor: colors.brand, opacity: loading ? 0.7 : 1 }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryTxt}>Send Reset Code</Text>
          )}
        </Pressable>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12 }}>
          <Text style={{ color: colors.sub }}>Remember your password? </Text>
          <Pressable onPress={() => router.replace("/login")}><Text style={{ color: "#EF4444", fontWeight: "800" }}>Sign In</Text></Pressable>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 6 }}>
          <Text style={{ color: colors.sub }}>Need a new account? </Text>
          <Pressable onPress={() => router.replace("/signup")}><Text style={{ color: "#EF4444", fontWeight: "800" }}>Sign Up</Text></Pressable>
        </View>

        <Text style={{ color: colors.sub, fontSize: 12, textAlign: "center", marginTop: 24 }}>
          🔒 Your information is secure with Errand Shop
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 70 },
  hBack: { height: 44, justifyContent: "center", paddingHorizontal: 12, },
  iconPill: { width: 64, height: 64, borderRadius: 32, alignSelf: "center", marginTop: 16, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 6 },
  sub: { textAlign: "center", marginTop: 8, lineHeight: 20 },
  input: { marginTop: 16, height: 48, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1 },
  primary: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 14 },
  primaryTxt: { color: "#fff", fontWeight: "800" },
});
