import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

export default function PasswordUpdatedScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.badge, { backgroundColor: colors.card }]}>
        <Ionicons name="cart" size={22} color="#E11D48" />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Password Updated</Text>
      <Text style={[styles.sub, { color: colors.sub }]}>Your account is now secure with your new password</Text>

      <View style={styles.checkWrap}>
        <View style={styles.checkRing}>
          <Ionicons name="checkmark" size={28} color="#22C55E" />
        </View>
      </View>

      <Text style={[styles.success, { color: colors.text }]}>Success!</Text>
      <Text style={[styles.sub2, { color: colors.sub }]}>
        Your password has been updated successfully. You can now log in with your new password.
      </Text>

      <Pressable style={[styles.primaryBtn, { backgroundColor: colors.brand }]} onPress={() => navigation.replace("Login")}>
        <Text style={styles.primaryTxt}>Log In Now</Text>
      </Pressable>

      <View style={[styles.info, { backgroundColor: '#EEF2FF' }]}>
        <Ionicons name="help-circle" size={16} color="#4338CA" />
        <Text style={[styles.infoTxt, { color: '#4338CA' }]}>
          Having trouble logging in? Contact our support team for assistance.
        </Text>
      </View>

      <View style={styles.secureRow}>
        <Ionicons name="lock-closed" size={14} color={colors.sub} />
        <Text style={[styles.secTxt, { color: colors.sub }]}>Your information is secure with Errand Shop</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  badge: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center", alignSelf: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  sub: { textAlign: "center", marginTop: 6 },
  checkWrap: { alignItems: "center", marginTop: 18 },
  checkRing: { 
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#E8FDEB", 
    alignItems: "center", justifyContent: "center" 
  },
  success: { textAlign: "center", fontSize: 18, fontWeight: "900", marginTop: 10 },
  sub2: { textAlign: "center", marginTop: 6, lineHeight: 20 },
  primaryBtn: {
    borderRadius: 12, height: 48, alignItems: "center", justifyContent: "center",
    marginTop: 16, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  info: { 
    flexDirection: "row", gap: 8, padding: 12, borderRadius: 10, marginTop: 12 
  },
  infoTxt: { flex: 1, flexWrap: "wrap" },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secTxt: { marginLeft: 6, fontSize: 12 },
});
