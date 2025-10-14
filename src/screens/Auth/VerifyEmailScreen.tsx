import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from "../../theme/ThemeProvider";
import { dataService } from "../../services/dataService";
import { authService } from "../../services/authService";

export default function VerifyEmailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const email = route?.params?.email ?? "user@example.com";
  const firstName = route?.params?.firstName ?? "";
  const lastName = route?.params?.lastName ?? "";
  const phone = route?.params?.phone ?? "";
  const password = route?.params?.password ?? "";
  const length = 6;
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const inputs = Array.from({ length }, () => useRef<TextInput>(null));

  const [seconds, setSeconds] = useState(5 * 60); // 05:00

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const handleChange = (text: string, idx: number) => {
    const char = text.slice(-1).replace(/\D/g, ""); // only last digit
    const next = [...code];
    next[idx] = char;
    setCode(next);
    if (char && idx < length - 1) inputs[idx + 1].current?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[idx] && idx > 0) {
      inputs[idx - 1].current?.focus();
    }
  };

  const verify = async () => {
    const joined = code.join("");
    if (joined.length !== length) {
      Alert.alert("Invalid Code", "Please enter the complete verification code.");
      return;
    }
    
    try {
      // Verify email with the code
      const verifyResult = await dataService.verifyEmail(joined);
      
      if (verifyResult.success) {
        console.log('✅ Email verification successful, now logging in user...');
        
        // After successful email verification, automatically log the user in
        const loginResult = await dataService.login(email, password);
        
        if (loginResult.success && loginResult.data) {
          console.log('🔐 Auto-login successful after verification');
          
          // Store tokens and user data
          const { token, refreshToken, user } = loginResult.data;
          await authService.setLoggedIn(true, token, refreshToken, user);
          
          // Verify tokens were stored
          const storedToken = await authService.getToken();
          console.log('🔍 Token verification after auto-login:', {
            hasToken: !!storedToken,
            tokenLength: storedToken?.length
          });
          
          await AsyncStorage.setItem("firstLoginComplete", "1");
          navigation.replace("AccountCreated", { email, name: `${firstName} ${lastName}` });
        } else {
          console.log('❌ Auto-login failed after verification:', loginResult.message);
          Alert.alert("Login Error", "Email verified successfully, but automatic login failed. Please login manually.");
          // Navigate to login screen instead
          navigation.navigate("Login");
        }
      } else {
        Alert.alert("Verification Failed", verifyResult.message || "Invalid verification code.");
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const resend = async () => {
    try {
      const result = await dataService.resendOTP(email);
      if (result.success) {
        setSeconds(5 * 60);
        Alert.alert("Code Sent", "A new verification code has been sent to your email.");
      } else {
        Alert.alert("Error", result.message || "Failed to resend code.");
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert("Error", "Failed to resend verification code.");
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.topBadge, { backgroundColor: colors.card }]}>
        <Ionicons name="mail" size={32} color={colors.brand} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
      <Text style={[styles.sub, { color: colors.sub }]}>
        We've sent a 6-digit code to {email}. Enter it below to verify your account.
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
      <View style={styles.codeRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={inputs[i]}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            style={[
              styles.codeBox,
              { borderColor: colors.border, backgroundColor: colors.card, color: colors.text },
              digit && [styles.codeBoxFilled, { borderColor: colors.brand }],
            ]}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Text style={[styles.timer, { color: colors.sub }]}>Code expires in {mm}:{ss}</Text>

      <Pressable
        style={[styles.verifyBtn, { backgroundColor: colors.brand, opacity: code.join("").length === length ? 1 : 0.5 }]}
        onPress={verify}
        disabled={code.join("").length !== length}
      >
        <Text style={styles.verifyTxt}>Verify Email</Text>
      </Pressable>

      <View style={styles.resendRow}>
        <Text style={[{ color: colors.sub }]}>Didn't receive the code? </Text>
        <Pressable onPress={resend} disabled={seconds > 0}>
          <Text style={[styles.link, { color: seconds > 0 ? colors.sub : "#E53935" }]}>Resend</Text>
        </Pressable>
      </View>

      <View style={[styles.infoBox, { backgroundColor: "#EEF6FF" }]}>
        <Ionicons name="information-circle" size={16} color="#1E40AF" />
        <Text style={[styles.infoTxt, { color: "#1E40AF" }]}>
          Check your spam folder if you don't see the email in your inbox.
        </Text>
      </View>

      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color={colors.sub} />
        <Text style={[{ color: colors.sub, marginLeft: 6 }]}>Back to Sign Up</Text>
      </Pressable>

      <View style={styles.secureRow}>
        <Ionicons name="lock-closed" size={14} color={colors.sub} />
        <Text style={[styles.secureTxt, { color: colors.sub }]}>Your information is secure with Errand Shop</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, paddingHorizontal: 18, paddingTop: 70,
  },
  topBadge: {
    alignSelf: "center", width: 74, height: 74, borderRadius: 37,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  sub: { textAlign: "center", marginTop: 4, marginBottom: 16 },
  label: { fontWeight: "700", marginBottom: 8 },
  codeRow: { flexDirection: "row", justifyContent: "space-between" },
  codeBox: {
    width: 48, height: 52, borderRadius: 10, borderWidth: 1,
    textAlign: "center", fontSize: 20, fontWeight: "800",
  },
  codeBoxFilled: {},
  timer: { textAlign: "center", marginTop: 12 },
  verifyBtn: {
    borderRadius: 12, height: 48,
    alignItems: "center", justifyContent: "center", marginTop: 16,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  verifyTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  link: { fontWeight: "800" },
  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, marginTop: 14,
  },
  infoTxt: { flex: 1, flexWrap: "wrap" },
  backRow: { flexDirection: "row", alignItems: "center", marginTop: 18, alignSelf: "flex-start" },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 },
  secureTxt: { marginLeft: 6, fontSize: 12 },
});
