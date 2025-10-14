import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";

const CODE_LEN = 6;

export default function ForgotVerifyScreen() {
  const { colors } = useTheme();
  const [code, setCode] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [sec, setSec] = useState(59);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const setDigit = (i: number, v: string) => {
    const next = [...code];
    next[i] = v.replace(/\D/g, "").slice(-1);
    setCode(next);
    if (next[i] && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const verify = () => {
    // TODO: verify OTP with API
    router.push("/forgot/new-password");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={{ padding: 16 }}>
        <View style={[styles.badge, { backgroundColor: "#FFE7E5" }]} />
        <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
        <Text style={[styles.sub, { color: colors.sub }]}>
          We’ve sent a 6-digit code to <Text style={{ fontWeight: "800", color: colors.text }}>user@example.com</Text>
        </Text>

        <Text style={[styles.label, { color: colors.sub }]}>Enter Verification Code</Text>
        <View style={styles.codeRow}>
          {code.map((c, i) => (
            <TextInput
              key={i}
              ref={(r: TextInput | null): void => { inputs.current[i] = r }}
              value={c}
              onChangeText={(v) => setDigit(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={[
                styles.codeBox,
                { borderColor: colors.border, backgroundColor: colors.card, color: colors.text },
              ]}
              textAlign="center"
              autoFocus={i === 0}
              returnKeyType="next"
            />
          ))}
        </View>

        <Text style={[styles.countdown, { color: colors.sub }]}>
          Code expires in <Text style={{ color: "#EF4444", fontWeight: "800" }}>
            {`0${Math.floor(sec / 60)}`.slice(-2)}:{`0${sec % 60}`.slice(-2)}
          </Text>
        </Text>

        <Pressable onPress={verify} style={[styles.primary, { backgroundColor: colors.brand }]}>
          <Text style={styles.primaryTxt}>Verify Code</Text>
        </Pressable>

        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Text style={{ color: colors.sub }}>Didn’t receive the code?</Text>
          <Pressable disabled={sec > 0} onPress={() => setSec(59)}>
            <Text style={{ color: "#EF4444", fontWeight: "800", marginTop: 4 }}>
              ⟳ Resend Code
            </Text>
          </Pressable>
        </View>

        <View style={[styles.info, { backgroundColor: "#EEF3FF" }]}>
          <Text style={{ color: colors.text }}>
            ℹ️  Check your spam folder if you don’t see the email in your inbox.
          </Text>
        </View>

        <Text style={{ color: colors.sub, fontSize: 12, textAlign: "center", marginTop: 10 }}>
          🔒 Your information is secure with Errand Shop
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 70 },
  badge: { width: 64, height: 64, borderRadius: 32, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 4 },
  sub: { textAlign: "center", marginTop: 6, lineHeight: 20 },
  label: { marginTop: 16, marginBottom: 8 },
  codeRow: { flexDirection: "row", justifyContent: "space-between" },
  codeBox: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, fontSize: 20 },
  countdown: { textAlign: "center", marginTop: 10 },
  primary: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 14 },
  primaryTxt: { color: "#fff", fontWeight: "800" },
  info: { padding: 12, borderRadius: 10, marginTop: 14 },
});
