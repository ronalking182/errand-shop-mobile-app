import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter, usePathname } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";

import { useCartStore } from "../../src/store/cart.store";

const ORANGE = "#FF7A2F";
const GREY = "#6B7280";
const CART_GREEN = "#2E7D32";
const BADGE_ORANGE = "#F59E0B";

function FloatingNavBar() {
  const { bottom } = useSafeAreaInsets();
  const itemCount = useCartStore((s) => s.itemCount);
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  const navItems = [
    { name: 'Home', icon: 'home', route: '/(tabs)/home', activeRoutes: ['/home', '/(tabs)/home'] },
    { name: 'Lists', icon: 'list-outline', route: '/(tabs)/lists', activeRoutes: ['/lists', '/(tabs)/lists'] },
    { name: 'Cart', icon: 'cart', route: '/cart', isCenter: true },
    { name: 'Orders', icon: 'time-outline', route: '/(tabs)/orders', activeRoutes: ['/orders', '/(tabs)/orders'] },
    { name: 'Profile', icon: 'person', route: '/(tabs)/profile', activeRoutes: ['/profile', '/(tabs)/profile'] },
  ];

  const isActive = (item: any) => {
    if (item.activeRoutes) {
      return item.activeRoutes.some((route: string) => pathname === route || pathname.startsWith(route));
    }
    return false;
  };

  return (
      <View style={[styles.floatingNav, { bottom: 0 }]}>
      {navItems.map((item, index) => {
        if (item.isCenter) {
          return (
            <View key={item.name} style={styles.centerButtonContainer}>
              <TouchableOpacity
                onPress={() => router.push(item.route as any)}
                style={styles.centerButton}
              >
                <View style={styles.centerButtonCircle}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={28} color="#fff" />
                  {itemCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {itemCount > 99 ? "99+" : itemCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        }
        
        const active = isActive(item);
        const color = active ? ORANGE : GREY;
        
        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => router.push(item.route as any)}
            style={styles.navItem}
          >
            <Ionicons 
              name={item.icon as keyof typeof Ionicons.glyphMap} 
              size={24} 
              color={color} 
            />
            <Text style={[styles.navLabel, { color }]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: ORANGE,
          tabBarInactiveTintColor: GREY,
          tabBarStyle: {
            display: 'none', // Hide the default tab bar since we're using floating nav
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
          tabBarIcon: ({ color }) => {
            const map: Record<string, keyof typeof Ionicons.glyphMap> = {
              home: "home",
              lists: "list-outline",
              orders: "time-outline",
              profile: "person",
            };
            const icon = map[route.name] ?? "ellipse";
            return React.createElement(Ionicons, {
              name: icon,
              size: 24,
              color: color
            });
          },
        })}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="lists" options={{ title: "Lists" }} />
        <Tabs.Screen name="orders" options={{ title: "Orders" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
      
      {/* Floating Navigation Bar */}
      <FloatingNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  floatingNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    height: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  centerButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  centerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CART_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: BADGE_ORANGE,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 10 },
});
