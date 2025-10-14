import { Ionicons } from "@expo/vector-icons";
import * as React from 'react';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { authService } from "../../services/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiService } from "../../services/apiService";
import { router } from "expo-router";

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const insets = useSafeAreaInsets();

  const onLogin = async () => {
    if (loading) return;
    
    // Basic validation
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Email validation
    if (!email.includes('@')) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    
    try {
      // Use the updated API service
      const response = await apiService.login(email, password);
      
      // Replace the current check
      if (!response.success || !response.data) {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // More specific error messages
        let errorMessage = "Login failed. Please try again.";
        if (response.message) {
          if (response.message.includes('not found') || response.message.includes('user does not exist')) {
            errorMessage = "Account not found. Please check your email or sign up first.";
          } else if (response.message.includes('password')) {
            errorMessage = "Incorrect password. Please try again.";
          } else {
            errorMessage = response.message;
          }
        }
        
        Alert.alert("Login Failed", errorMessage);
        return;
      }

      // Update auth service with backend data
      const { token, refreshToken, user } = response.data;
      console.log('🔐 Login - Storing tokens:', { 
        hasToken: !!token, 
        tokenLength: token?.length, 
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length,
        user: user?.email 
      });
      await authService.setLoggedIn(true, token, refreshToken, user);
      
      // Verify tokens were stored
      const storedToken = await authService.getToken();
      console.log('🔍 Login - Verification after storage:', {
        storedTokenExists: !!storedToken,
        storedTokenLength: storedToken?.length
      });
      
      // Reset failed attempts on success
      setFailedAttempts(0);
      
      // Navigate to main app
      router.replace('/(tabs)/home');
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.screen, { backgroundColor: colors.card, paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* TOP */}
      <View style={styles.header}>
        <View style={[styles.topIconShadow, { backgroundColor: colors.card }]}>
          <View style={[styles.topIconCircle, { backgroundColor: colors.card }]}>
            <Image
              source={require("../../../assets/images/signature-cart.png")}
              style={{ width: 42, height: 42, resizeMode: "contain" }}
            />
          </View>
        </View>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
        />
        <Text style={[styles.tagline, { color: colors.sub }]}>Your shopping companion</Text>
      </View>

      {/* CARD */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.welcome, { color: colors.text }]}>Welcome Back!</Text>

        {/* Email Input */}
        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor={colors.sub}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <View style={styles.passwordRow}>
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          {failedAttempts >= 3 && (
            <Pressable onPress={() => router.push("/forgot")}>
              <Text style={styles.forgot}>Forgot?</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.passwordInputWrap}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={colors.sub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            style={[styles.input, styles.passwordInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          />
          <Pressable style={styles.eye} onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? "eye-off" : "eye"} size={20} color={colors.sub} />
          </Pressable>
        </View>

        {/* Login Button - Update this part */}
        <Pressable 
          style={[
            styles.loginBtn, 
            { 
              backgroundColor: loading ? colors.muted : colors.brand,
              opacity: loading ? 0.7 : 1 
            }
          ]} 
          onPress={onLogin}
          disabled={loading}
        >
          <Text style={styles.loginTxt}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerTxt, { color: colors.sub }]}>Don't have an account? </Text>
        <Pressable onPress={() => router.push("/signup")}>
          <Text style={styles.signUp}>Sign Up</Text>
        </Pressable>
      </View>
      
      <Pressable
        style={[styles.loginBtn, { backgroundColor: '#ff6b6b', marginHorizontal: 18, marginTop: 10 }]}
        onPress={async () => {
          console.log('🧪 MANUAL REGISTRATION TEST - START');
          try {
            const { apiService } = require('../../services/apiService');
            await apiService.testRegistration();
            console.log('🧪 MANUAL REGISTRATION TEST - SUCCESS');
          } catch (error) {
            console.log('🧪 MANUAL REGISTRATION TEST - ERROR:', error);
          }
        }}
      >
        <Text style={styles.loginTxt}>🧪 Test Registration API</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 10,
  },
  topIconShadow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 12,
  },
  topIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 210,
    height: 56,
    resizeMode: "contain",
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    marginHorizontal: 18,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },

  label: {
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  forgot: {
    color: "#E53935",
    fontWeight: "700",
  },
  passwordInputWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 44,
    marginTop: 6,
  },
  eye: {
    position: "absolute",
    right: 12,
    top: 16,
    padding: 4,
  },
  loginBtn: {
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  loginTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    alignSelf: "center",
    flexDirection: "row",
    marginTop: 18,
  },
  footerTxt: {},
  signUp: { color: "#E53935", fontWeight: "800" },
});
