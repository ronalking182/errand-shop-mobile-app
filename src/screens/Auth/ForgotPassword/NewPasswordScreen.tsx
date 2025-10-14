import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

export default function NewPasswordScreen() {
  const { colors } = useTheme();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const s = scorePassword(pw);
  const barColor = s <= 1 ? "#EF4444" : s === 2 ? "#F59E0B" : "#10B981";
  const strength = s <= 1 ? "Weak" : s === 2 ? "Medium" : "Strong";

  const canSubmit = useMemo(() => pw.length >= 8 && pw === confirm && s >= 2, [pw, confirm, s]);

  const update = () => {
    // TODO call API to update password
    router.replace("/forgot/success");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={{ padding: 16 }}>
        <View style={[styles.iconPill, { backgroundColor: "#FFEDEA" }]} />
        <Text style={[styles.title, { color: colors.text }]}>Set New Password</Text>
        <Text style={[styles.sub, { color: colors.sub }]}>
          Create a strong password for your account
        </Text>

        <Text style={[styles.label, { color: colors.sub }]}>New Password</Text>
        <View style={{ position: "relative" }}>
          <TextInput
            value={pw}
            onChangeText={setPw}
            secureTextEntry={!show}
            placeholder="********"
            placeholderTextColor={colors.sub}
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.card, color: colors.text },
            ]}
          />
          <Pressable onPress={() => setShow((v) => !v)} style={styles.eye}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.sub} />
          </Pressable>
        </View>

        {/* strength bar */}
        <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 8 }}>
          <View style={{ height: 4, width: `${(s / 4) * 100}%`, backgroundColor: barColor, borderRadius: 2 }} />
        </View>
        <Text style={{ color: colors.sub, marginTop: 6 }}>Password strength: <Text style={{ color: barColor }}>{strength}</Text></Text>

        {/* checklist */}
        <View style={{ marginTop: 8 }}>
          <Check ok={pw.length >= 8} text="At least 8 characters" />
          <Check ok={/[A-Z]/.test(pw)} text="At least 1 uppercase letter" />
          <Check ok={/[0-9]/.test(pw)} text="At least 1 number" />
          <Check ok={/[^A-Za-z0-9]/.test(pw)} text="At least 1 special character" />
        </View>

        <Text style={[styles.label, { color: colors.sub, marginTop: 12 }]}>Confirm Password</Text>
        <View style={{ position: "relative" }}>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!show2}
            placeholder="********"
            placeholderTextColor={colors.sub}
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.card, color: colors.text },
            ]}
          />
          <Pressable onPress={() => setShow2((v) => !v)} style={styles.eye}>
            <Ionicons name={show2 ? "eye-off-outline" : "eye-outline"} size={20} color={colors.sub} />
          </Pressable>
        </View>

        <Pressable
          disabled={!canSubmit}
          onPress={update}
          style={[
            styles.primary,
            { backgroundColor: canSubmit ? colors.brand : "#E5E7EB" },
          ]}
        >
          <Text style={[styles.primaryTxt, { color: canSubmit ? "#fff" : "#9CA3AF" }]}>
            Update Password
          </Text>
        </Pressable>

        <Text style={{ color: colors.sub, fontSize: 12, textAlign: "center", marginTop: 16 }}>
          🔒 Your information is secure with Errand Shop
        </Text>
      </View>
    </View>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
      <Text style={{ color: ok ? "#22C55E" : "#9CA3AF" }}>{ok ? "✔︎" : "✖︎"}</Text>
      <Text style={{ color: "#6B7280" }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 70},
  iconPill: { width: 64, height: 64, borderRadius: 32, alignSelf: "center", marginTop: 12, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  sub: { textAlign: "center", marginTop: 6, lineHeight: 20 },
  label: { marginTop: 12, marginBottom: 6 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1 },
  eye: { position: "absolute", right: 12, top: 12, height: 24, width: 24, alignItems: "center", justifyContent: "center" },
  primary: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 16 },
  primaryTxt: { fontWeight: "800" },
});
