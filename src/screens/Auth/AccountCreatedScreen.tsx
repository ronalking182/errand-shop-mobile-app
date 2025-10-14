import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef } from "react";
import {
  Animated, Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
// @ts-ignore
import ConfettiCannon from "react-native-confetti-cannon";
import { useTheme } from "../../theme/ThemeProvider";

type Props = {
  navigation: any;
  route: {
    params?: {
      name?: string; email?: string; accountId?: string;
      memberSince?: string; avatarUri?: string;
    };
  };
};

export default function AccountCreatedScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const {
    name = "Sarah Johnson",
    email = "sarah.johnson@email.com",
    accountId = "#FM2024001",
    memberSince = "January 2024",
    avatarUri,
  } = route?.params || {};

  // slide + fade on mount
  const slide = useRef(new Animated.Value(30)).current;
  const fade  = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
    
    // Fire confetti after a short delay
    setTimeout(() => confettiRef.current?.start(), 300);
  }, []);

  // In the goHome function, change to navigate to Verified screen first:
  const goHome = async () => {
    await AsyncStorage.setItem("firstLoginComplete", "1");
    navigation.navigate("Verified"); // Changed from replace("Home") to navigate("Verified")
  };

  const goProfile = () => navigation.navigate("Profile");

  return (
    <Animated.View style={[styles.screen, { backgroundColor: colors.bg, transform: [{ translateY: slide }], opacity: fade }]}>
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
      />
      
      <View style={styles.badgeWrap}>
        <View style={[styles.badgeRing, { backgroundColor: '#DCFCE7' }]}>
          <View style={[styles.badgeInner, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark" size={32} color="#22C55E" />
          </View>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Account Created!</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>
        Welcome to Errand Shop! Your account has been successfully created and is ready to use.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                  {name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={[styles.avatarRing, { borderColor: '#22C55E' }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.email, { color: colors.sub }]}>{email}</Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.sub }]}>Account ID</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{accountId}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.sub }]}>Member Since</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{memberSince}</Text>
        </View>
      </View>

      <Pressable style={[styles.primaryBtn, { backgroundColor: colors.brand }]} onPress={goHome}>
        <Text style={styles.primaryTxt}>Start Shopping</Text>
      </Pressable>

      <Pressable style={[styles.secondaryBtn, { backgroundColor: colors.muted }]} onPress={goProfile}>
        <Text style={[styles.secondaryTxt, { color: colors.text }]}>View Profile</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 70 },
  badgeWrap: { alignItems: "center", marginBottom: 10 },
  badgeRing: {
    width: 86, height: 86, borderRadius: 43,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  badgeInner: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "900", textAlign: "center", marginTop: 8 },
  subtitle: { textAlign: "center", marginTop: 6, lineHeight: 20 },
  card: {
    borderRadius: 16, padding: 16, marginTop: 18,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { position: "absolute", width: 56, height: 56, borderRadius: 28, borderWidth: 2, top: -3, left: -3 },
  name: { fontSize: 16, fontWeight: "800" },
  email: { marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel: {},
  rowValue: { fontWeight: "700" },
  primaryBtn: {
    borderRadius: 14, height: 50,
    alignItems: "center", justifyContent: "center", marginTop: 18,
    shadowColor: "#000", shadowOpacity: Platform.OS === "ios" ? 0.25 : 0.12,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: {
    borderRadius: 14, height: 50,
    alignItems: "center", justifyContent: "center", marginTop: 10,
  },
  secondaryTxt: { fontWeight: "700", fontSize: 15 },
});
