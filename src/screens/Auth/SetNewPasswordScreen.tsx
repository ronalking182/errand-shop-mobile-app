import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

function evaluateStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[Math.max(0, score - 1)] || "Weak" };
}

export default function SetNewPasswordScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { identifier, token } = route?.params || {};
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const rules = useMemo(() => ({
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }), [pw]);

  const strength = evaluateStrength(pw);

  const update = async () => {
    if (pw !== confirm) return;
    // TODO: POST /auth/password/reset { identifier, token, newPassword: pw }
    navigation.replace("PasswordUpdated");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.headRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>
        <View style={[styles.topBadge, { backgroundColor: colors.card }]}>
          <Ionicons name="key" size={22} color="#E11D48" />
        </View>
        <View style={{ width: 18 }} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Set New Password</Text>
      <Text style={[styles.sub, { color: colors.sub }]}>Create a strong password to secure your account</Text>

      <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Enter new password"
          placeholderTextColor={colors.sub}
          value={pw}
          onChangeText={setPw}
          secureTextEntry={!show1}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
        />
        <Pressable style={styles.eye} onPress={() => setShow1(!show1)}>
          <Ionicons name={show1 ? "eye-off" : "eye"} size={18} color={colors.sub} />
        </Pressable>
      </View>

      {pw.length > 0 && (
        <>
          <View style={styles.strengthBarWrap}>
            <View style={[
              styles.strengthBar,
              {
                width: `${(strength.score / 4) * 100}%`,
                backgroundColor: strength.score <= 1 ? "#EF4444" : strength.score <= 2 ? "#F59E0B" : strength.score <= 3 ? "#10B981" : "#059669"
              }
            ]} />
          </View>
          <Text style={[styles.ruleTitle, { color: colors.sub }]}>Password Requirements:</Text>
          <Rule ok={rules.len} text="At least 8 characters" />
          <Rule ok={rules.upper} text="One uppercase letter" />
          <Rule ok={rules.num} text="One number" />
          <Rule ok={rules.special} text="One special character" />
        </>
      )}

      <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Confirm Password</Text>
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Confirm new password"
          placeholderTextColor={colors.sub}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!show2}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
        />
        <Pressable style={styles.eye} onPress={() => setShow2(!show2)}>
          <Ionicons name={show2 ? "eye-off" : "eye"} size={18} color={colors.sub} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryBtn, { backgroundColor: colors.brand, opacity: pw && confirm && pw === confirm ? 1 : 0.5 }]}
        onPress={update}
        disabled={!pw || !confirm || pw !== confirm}
      >
        <Text style={styles.primaryTxt}>Update Password</Text>
      </Pressable>

      <View style={styles.secureRow}>
        <Ionicons name="lock-closed" size={14} color={colors.sub} />
        <Text style={[styles.secTxt, { color: colors.sub }]}>Your information is secure with Errand Shop</Text>
      </View>
    </View>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
      <Ionicons name={ok ? "checkmark-circle" : "close-circle"} size={16} color={ok ? "#16A34A" : "#EF4444"} />
      <Text style={{ color: colors.text, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topBadge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 8 },
  sub: { textAlign: "center", marginTop: 6, marginBottom: 16 },
  label: { fontWeight: "700", marginBottom: 6 },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14,
  },
  eye: { position: "absolute", right: 12, top: 12 },
  strengthBarWrap: { height: 4, backgroundColor: "#EFEFEF", borderRadius: 2, marginTop: 8 },
  strengthBar: { height: 4, borderRadius: 2 },
  ruleTitle: { marginTop: 8 },
  primaryBtn: {
    borderRadius: 12, height: 48,
    alignItems: "center", justifyContent: "center", marginTop: 14,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
  secTxt: { marginLeft: 6, fontSize: 12 },
});
