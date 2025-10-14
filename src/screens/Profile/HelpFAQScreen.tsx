import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQItemProps = {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
};

function FAQItemComponent({ item, isExpanded, onToggle, colors }: FAQItemProps) {
  return (
    <View style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onToggle} style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.sub} 
        />
      </Pressable>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={[styles.faqAnswerText, { color: colors.sub }]}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpFAQScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const faqData: FAQItem[] = [
    {
      question: "What services do you offer?",
      answer: "We buy fresh food items from the market and other store items based on your shopping list. We clean, prep, package and deliver them to your doorstep for orders placed before 4pm."
    },
    {
      question: "How do I place an order?",
      answer: "You can place your order through the app or WhatsApp."
    },
    {
      question: "Can you get every item I request?",
      answer: "We will make every effort to find exactly what you ask for. If an item is unavailable, we'll contact you for approval before substituting it with a similar product or converting it to a coupon for future use."
    },
    {
      question: "Do you charge service charge fee?",
      answer: "No, we do not charge service charge for our services."
    },
    {
      question: "Do you charge extra for delivery?",
      answer: "Yes. Delivery fees depend on your location and will be communicated before you confirm your order."
    },
    {
      question: "How soon will my order arrive?",
      answer: "Delivery takes 2 to 4 hours or less as this depends on order size, market conditions, and location. We'll give you an estimated delivery time when confirming your order."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept card payments, bank transfers, USSD, and mobile payments through our secure payment gateway. Payment is to be made before delivery."
    },
    {
      question: "What if I'm not home when you deliver?",
      answer: "We recommend ensuring someone is available to receive your delivery. If not, extra delivery charges may apply for a second attempt."
    },
    {
      question: "What if I'm unhappy with the items?",
      answer: "If any item is damaged or spoiled at the time of delivery, contact us within 2 hours with a photo, and we'll review the case. Due to the perishable nature of fresh goods, returns are generally not accepted."
    },
    {
      question: "Do you handle special or bulk orders?",
      answer: "Yes! For bulk orders please contact us at least three days in advance so we can prepare accordingly."
    },
    {
      question: "Can you deliver to multiple addresses?",
      answer: "Yes, but each delivery location will have its own delivery fee."
    }
  ];

  const handleContactSupport = () => {
    router.push("/support/chat");
  };

  const handleCallSupport = () => {
    Alert.alert(
      "Contact Support",
      "How would you like to contact our support team?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Chat Support",
          onPress: () => router.push("/support/chat")
        },
        {
          text: "Call Now",
          onPress: () => Linking.openURL('tel:+2348144611443')
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>Help & FAQs</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={[styles.headerIcon, { backgroundColor: "#FFF3EC" }]}>
            <Ionicons name="help-circle" size={32} color={colors.brand} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          <Text style={[styles.headerSubtitle, { color: colors.sub }]}>
            Find answers to common questions about our services
          </Text>
        </View>

        {/* FAQ Items */}
        {faqData.map((item, index) => (
          <FAQItemComponent
            key={index}
            item={item}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleItem(index)}
            colors={colors}
          />
        ))}

        {/* Contact Support */}
        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="chatbubble-ellipses" size={24} color={colors.brand} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>Still need help?</Text>
          </View>
          <Text style={[styles.contactSubtitle, { color: colors.sub }]}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          
          <View style={styles.contactButtons}>
            <Pressable 
              style={[styles.contactButton, { backgroundColor: colors.brand }]} 
              onPress={handleContactSupport}
            >
              <Ionicons name="mail-outline" size={18} color="white" />
              <Text style={styles.contactButtonText}>Email Support</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.contactButton, { backgroundColor: "#22C55E" }]} 
              onPress={handleCallSupport}
            >
              <Ionicons name="call-outline" size={18} color="white" />
              <Text style={styles.contactButtonText}>Call Support</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  hBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "900",
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
    alignItems: "center",
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  contactButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});