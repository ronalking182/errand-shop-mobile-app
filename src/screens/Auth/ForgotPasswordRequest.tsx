import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

export default function ForgotPasswordRequest({ navigation }: any) {
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState("");

  const sendReset = async () => {
    // TODO: POST /auth/password/forgot  { identifier }
    const target = identifier.includes("@") ? identifier : "your email/phone";
    navigation.navigate("ResetVerify", { identifier, target });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.text} />
        <Text style={[styles.backTxt, { color: colors.text }]}>Back to Login</Text>
      </Pressable>

      <View style={[styles.badge, { backgroundColor: colors.card }]}>
        <Image source={require("../../assets/images/signature-cart.png")}
               style={{ width: 38, height: 38, resizeMode: "contain" }} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
      <Text style={[styles.sub, { color: colors.sub }]}>
        Enter your email or phone number and we'll send you a link to reset your password
      </Text>

      <TextInput
        placeholder="Email or Phone Number"
        placeholderTextColor={colors.sub}
        value={identifier}
        onChangeText={setIdentifier}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable style={[styles.primaryBtn, { backgroundColor: colors.brand }]} onPress={sendReset}>
        <Text style={styles.primaryTxt}>Send Reset Link</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={[styles.backTxt, { color: colors.sub }]}>Remember your password? </Text>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.link, { color: '#D7263D' }]}>Log In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  backTxt: { marginLeft: 6 },
  badge: {
    width: 74, height: 74, borderRadius: 37,
    alignSelf: "center", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    marginVertical: 8,
  },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 4 },
  sub: { textAlign: "center", marginTop: 6 },
  input: {
    marginTop: 18, height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14,
  },
  primaryBtn: {
    borderRadius: 12, height: 48, alignItems: "center", justifyContent: "center",
    marginTop: 14, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  link: { fontWeight: "800" },
});
