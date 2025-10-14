import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";

function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segBtn,
        {
          backgroundColor: active ? colors.card : "transparent",
          borderColor: active ? colors.border : "transparent",
        },
      ]}
    >
      <Text
        style={{
          color: active ? colors.text : colors.sub,
          fontWeight: active ? "800" as const : "600" as const,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function LegalInformationScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<"privacy" | "terms">("privacy");

  useEffect(() => {
    if (params?.tab === "terms") setTab("terms");
  }, [params?.tab]);

  const Content = useMemo(() => {
    if (tab === "privacy") return <Privacy colors={colors} />;
    return <Terms colors={colors} />;
  }, [tab, colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { 
            backgroundColor: colors.card, 
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12
          },
        ]}
      >
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>
          Legal Information
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Segmented control */}
      <View
        style={[
          styles.segWrap,
          { backgroundColor: colors.bg, borderBottomColor: colors.border },
        ]}
      >
        <SegButton
          label="Privacy Policy"
          active={tab === "privacy"}
          onPress={() => setTab("privacy")}
        />
        <SegButton
          label="Terms of Service"
          active={tab === "terms"}
          onPress={() => setTab("terms")}
        />
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {Content}
        </View>

        {/* Contact block */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 },
          ]}
        >
          <Text style={[styles.blockTitle, { color: colors.text }]}>
            Questions About Our Policies?
          </Text>
          <Text style={{ color: colors.sub, marginTop: 6 }}>
            If you have any questions or concerns about our privacy policy or
            terms of service, please contact our support team.
          </Text>

          <Pressable
            style={[styles.supportBtn, { backgroundColor: "#EF4444" }]}
            onPress={() => {/* open support */}}
          >
            <Ionicons name="headset-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "800", marginLeft: 8 }}>
              Contact Support
            </Text>
          </Pressable>
        </View>

        <Text
          style={{
            color: colors.sub,
            fontSize: 12,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          These policies were last updated on August 1, 2023
        </Text>
      </ScrollView>
    </View>
  );
}

/* ---------- Content blocks ---------- */

function SectionTitle({ children, colors }: any) {
  return (
    <Text style={{ fontWeight: "900", fontSize: 16, color: colors.text, marginTop: 14 }}>
      {children}
    </Text>
  );
}

function Bullet({ children, colors }: any) {
  return (
    <View style={{ flexDirection: "row", marginTop: 6 }}>
      <Text style={{ color: colors.text, marginRight: 6 }}>•</Text>
      <Text style={{ color: colors.text, flex: 1 }}>{children}</Text>
    </View>
  );
}

function Privacy({ colors }: any) {
  return (
    <View>
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
        Privacy Policy
      </Text>
      <Text style={{ color: colors.sub, marginTop: 6 }}>
        Last Updated: August 1, 2023
      </Text>

      <SectionTitle colors={colors}>Introduction</SectionTitle>
      <Text style={{ color: colors.text, marginTop: 6 }}>
        This Privacy Policy explains how we collect, use, disclose, and safeguard
        your information when you use our grocery app. Please read this privacy
        policy carefully. If you do not agree with the terms, please do not
        access the application.
      </Text>

      <SectionTitle colors={colors}>Information We Collect</SectionTitle>
      <Text style={{ color: colors.text, marginTop: 6 }}>
        We may collect information about you in various ways. The information we
        may collect via the Application includes:
      </Text>
      <Bullet colors={colors}>
        Personal Data: Name, email address, telephone number, address
      </Bullet>
      <Bullet colors={colors}>
        Derivative Data: Information our servers automatically collect
      </Bullet>
      <Bullet colors={colors}>
        Financial Data: Payment information for purchases
      </Bullet>
      <Bullet colors={colors}>
        Location Data: Information about your location
      </Bullet>

      <SectionTitle colors={colors}>How We Use Your Information</SectionTitle>
      <Bullet colors={colors}>To provide and maintain our Application</Bullet>
      <Bullet colors={colors}>
        To notify you about changes to our Application
      </Bullet>
      <Bullet colors={colors}>To process your orders and transactions</Bullet>
      <Bullet colors={colors}>To provide customer care and support</Bullet>
      <Bullet colors={colors}>To personalize your experience</Bullet>

      <SectionTitle colors={colors}>Disclosure of Your Information</SectionTitle>
      <Text style={{ color: colors.text, marginTop: 6 }}>
        We may share information we have collected about you in certain
        situations. Your information may be disclosed as follows:
      </Text>
      <Bullet colors={colors}>By Law or to Protect Rights</Bullet>
      <Bullet colors={colors}>Third-Party Service Providers</Bullet>
      <Bullet colors={colors}>Marketing Communications</Bullet>
      <Bullet colors={colors}>Business Transfers</Bullet>
    </View>
  );
}

function Terms({ colors }: any) {
  return (
    <View>
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
        Terms of Service
      </Text>
      <Text style={{ color: colors.sub, marginTop: 6 }}>
        Last Updated: August 1, 2023
      </Text>

      <SectionTitle colors={colors}>Acceptance of Terms</SectionTitle>
      <Text style={{ color: colors.text, marginTop: 6 }}>
        By using our app, you agree to be bound by these Terms. If you do not
        agree, please do not use the app.
      </Text>

      <SectionTitle colors={colors}>User Accounts</SectionTitle>
      <Bullet colors={colors}>You must provide accurate information.</Bullet>
      <Bullet colors={colors}>You are responsible for safeguarding your account.</Bullet>

      <SectionTitle colors={colors}>Orders & Payments</SectionTitle>
      <Bullet colors={colors}>All purchases are subject to availability.</Bullet>
      <Bullet colors={colors}>Prices and fees may change without notice.</Bullet>

      <SectionTitle colors={colors}>Limitation of Liability</SectionTitle>
      <Text style={{ color: colors.text, marginTop: 6 }}>
        To the fullest extent permitted by law, we are not liable for any
        indirect, incidental, or consequential damages.
      </Text>

      <SectionTitle colors={colors}>Changes to These Terms</SectionTitle>
      <Text style={{ color: colors.text, marginTop: 6 }}>
        We may update these Terms from time to time. Continued use of the app
        indicates acceptance of the updated Terms.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1,
  },
  hBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  hTitle: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: "900" },

  segWrap: {
    flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  segBtn: {
    flexGrow: 1, alignItems: "center", justifyContent: "center",
    height: 42, borderRadius: 10, borderWidth: 1,
  },

  card: {
    borderRadius: 12, borderWidth: 1, padding: 14,
  },

  blockTitle: { fontWeight: "900", fontSize: 16 },

  supportBtn: {
    marginTop: 14, height: 48, borderRadius: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
});
