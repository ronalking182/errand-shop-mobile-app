import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useNotificationStore } from "../../store/notification.store";

function CardRow({
  title,
  sub,
  value,
  onChange,
  icon,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, { backgroundColor: "#F3F4F6" }]}>
          <Ionicons name={icon} size={18} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={{ color: colors.sub, fontSize: 12 }}>{sub}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function NotificationPrefsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    preferences,
    hasPermission,
    loading,
    initializeNotifications,
    requestPermissions,
    updatePreferences,
  } = useNotificationStore();
  
  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    if (!hasPermission && value) {
      // Request permissions if trying to enable notifications
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    const newPrefs = { ...localPrefs, [key]: value };
    setLocalPrefs(newPrefs);
    await updatePreferences({ [key]: value });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: colors.border, 
          backgroundColor: colors.card,
          paddingTop: insets.top + 12
        }
      ]}>
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#FFEDEA", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="notifications" size={44} color="#EF4444" />
          </View>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16, marginTop: 12 }}>
            Stay Updated with Order Notifications
          </Text>
          <Text style={{ color: colors.sub, textAlign: "center", marginTop: 6 }}>
            Get real-time updates about your grocery orders and never miss out on exclusive promotions and discounts.
          </Text>
        </View>

        <CardRow
          icon="checkmark-done-outline"
          title="Order Updates"
          sub="Get notified about your order status"
          value={localPrefs.orderUpdates}
          onChange={(value) => handleToggle('orderUpdates', value)}
        />
        <CardRow
          icon="bicycle-outline"
          title="Delivery Notifications"
          sub="Get real-time delivery updates"
          value={localPrefs.deliveryNotifications}
          onChange={(value) => handleToggle('deliveryNotifications', value)}
        />
        <CardRow
          icon="pricetags-outline"
          title="Promotions & Discounts"
          sub="Get notified about special offers"
          value={localPrefs.promotions}
          onChange={(value) => handleToggle('promotions', value)}
        />
        <CardRow
          icon="cube-outline"
          title="Restock Alerts"
          sub="Know when your favorites are back in stock"
          value={localPrefs.restockAlerts}
          onChange={(value) => handleToggle('restockAlerts', value)}
        />

        {!hasPermission && (
          <View style={[styles.permissionBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={{ color: "#92400E", fontSize: 14, flex: 1, marginLeft: 8 }}>
              Notifications are disabled. Enable them to receive order updates.
            </Text>
          </View>
        )}
        
        <Pressable 
          style={[styles.cta, { 
            backgroundColor: hasPermission ? colors.brand : "#EF4444",
            opacity: loading ? 0.7 : 1 
          }]} 
          onPress={hasPermission ? () => router.back() : requestPermissions}
          disabled={loading}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            {loading ? 'Setting up...' : hasPermission ? 'Save Settings' : 'Enable Notifications'}
          </Text>
        </Pressable>
        
        {hasPermission && (
          <Pressable 
            style={[styles.cta, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} 
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.text, fontWeight: "800" }}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1 },
  hBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  hTitle: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: "900" },

  row: {
    borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", marginBottom: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "800" },

  cta: {
    height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    marginTop: 12,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
});
