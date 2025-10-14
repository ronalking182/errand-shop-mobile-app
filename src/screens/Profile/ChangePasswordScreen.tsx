import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeProvider";
import { apiService } from "../../services/apiService";
import { authService } from "../../services/authService";

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.changePassword(currentPassword, newPassword);

      if (response.success) {
        Alert.alert(
          "Success", 
          response.message || "Password changed successfully",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to change password");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to change password";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <Pressable 
        style={[styles.hBack, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={() => router.back()}
      >
        <Text style={{ color: colors.text }}>← Back</Text>
      </Pressable>

      <View style={{ padding: 16 }}>
        {/* Icon pill */}
        <View style={[styles.iconPill, { backgroundColor: "#FFF1ED" }]} />
        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
        <Text style={[styles.sub, { color: colors.sub }]}>
          Enter your current password and choose a new secure password
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current Password"
            placeholderTextColor={colors.sub}
            secureTextEntry={!showCurrentPassword}
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
          />
          <TouchableOpacity
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showCurrentPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.sub}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
            placeholderTextColor={colors.sub}
            secureTextEntry={!showNewPassword}
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showNewPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.sub}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm New Password"
            placeholderTextColor={colors.sub}
            secureTextEntry={!showConfirmPassword}
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.sub}
            />
          </TouchableOpacity>
        </View>

        <Pressable 
          onPress={handleChangePassword} 
          style={[styles.primary, { backgroundColor: colors.brand, opacity: loading ? 0.7 : 1 }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryTxt}>Change Password</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 70 },
  hBack: { height: 44, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  iconPill: { width: 64, height: 64, borderRadius: 32, alignSelf: "center", marginTop: 16, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 6 },
  sub: { textAlign: "center", marginTop: 8, lineHeight: 20 },
  inputContainer: { position: "relative", marginTop: 16 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 12, paddingRight: 50, borderWidth: 1 },
  eyeIcon: { position: "absolute", right: 15, top: 14, padding: 5 },
  primary: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 14 },
  primaryTxt: { color: "#fff", fontWeight: "800" },
});