import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

export default function ResetVerifyScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { target = "user@example.com", identifier } = route?.params || {};
  const LEN = 6;
  const [code, setCode] = useState<string[]>(Array(LEN).fill(""));
  const refs = Array.from({ length: LEN }, () => useRef<TextInput>(null));
  const [sec, setSec] = useState(5 * 60);

  useEffect(() => {
    const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  const onChange = (t: string, i: number) => {
    const v = t.replace(/\D/g, "").slice(-1);
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < LEN - 1) refs[i + 1].current?.focus();
  };

  const onKey = (e: any, i: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[i] && i > 0) refs[i - 1].current?.focus();
  };

  const verify = async () => {
    const joined = code.join("");
    if (joined.length !== LEN) return;
    // TODO: POST /auth/password/verify { identifier, code }
    navigation.navigate("SetNewPassword", { identifier, token: joined });
  };

  const resend = async () => {
    // TODO: POST /auth/password/resend { identifier }
    setSec(5 * 60);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBadge, { backgroundColor: colors.card }]}>
        <Ionicons name="shield" size={26} color={colors.brand} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Verify Reset Code</Text>
      <Text style={[styles.sub, { color: colors.sub }]}>
        We've sent a 6-digit code to {target}. Enter it below to reset your password.
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
      <View style={styles.row}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={refs[i]}
            value={digit}
            onChangeText={(t) => onChange(t, i)}
            onKeyPress={(e) => onKey(e, i)}
            style={[
              styles.box,
              digit && styles.boxActive,
              {
                borderColor: digit ? colors.brand : colors.border,
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Text style={[styles.timer, { color: colors.sub }]}>Code expires in {mm}:{ss}</Text>

      <Pressable
        style={[
          styles.btn,
          {
            backgroundColor: code.join("").length === LEN ? colors.brand : colors.muted,
          },
        ]}
        onPress={verify}
        disabled={code.join("").length !== LEN}
      >
        <Text style={[styles.btnTxt, { color: colors.bg }]}>Verify Code</Text>
      </Pressable>

      <View style={styles.resendRow}>
        <Text style={[styles.sub, { color: colors.sub }]}>Didn't receive the code? </Text>
        <Pressable onPress={resend} disabled={sec > 0}>
          <Text style={[styles.link, { color: colors.brand, opacity: sec > 0 ? 0.5 : 1 }]}>Resend</Text>
        </Pressable>
      </View>

      <View style={[styles.info, { backgroundColor: colors.card }]}>
        <Ionicons name="information-circle" size={16} color={colors.brand} />
        <Text style={[styles.infoTxt, { color: colors.text }]}>
          Check your spam folder if you don't see the email.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: "center" },
  topBadge: {
    width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  sub: { fontSize: 16, textAlign: "center", marginBottom: 32, lineHeight: 24 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  box: {
    width: 48, height: 56, borderWidth: 2, borderRadius: 12, textAlign: "center",
    fontSize: 24, fontWeight: "700",
  },
  boxActive: {},
  timer: { fontSize: 14, textAlign: "center", marginBottom: 32 },
  btn: {
    height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },
  btnTxt: { fontSize: 16, fontWeight: "800" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  link: { fontSize: 16, fontWeight: "700" },
  info: {
    flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12,
    borderWidth: 1,
  },
  infoTxt: { fontSize: 14, marginLeft: 8, flex: 1 },
});
