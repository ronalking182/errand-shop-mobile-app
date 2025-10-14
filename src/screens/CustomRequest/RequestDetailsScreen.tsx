import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useCustomRequestStore } from "../../store/customRequest.store";

// Money formatting function with comma separators
function money(v: number | string, ccy: "NGN" | "USD" = "NGN") {
  // Convert string to number if needed
  const numValue = typeof v === 'string' ? parseFloat(v) || 0 : v;
  return `${ccy === "USD" ? "$" : "₦"}${numValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type RequestStatus = "submitted" | "under_review" | "quote_sent" | "customer_accepted" | "approved" | "customer_declined" | "cancelled" | "in_cart";

type CustomRequest = {
  id: string;
  title: string;
  description: string;
  category?: string;
  budget?: number;
  deadline?: string;
  quantity?: number;
  unit?: string;
  status: RequestStatus;
  createdAt: string;
  estimatedPrice?: string;
  adminQuote?: number;
  productImages?: string[];
  preferredBrand?: string;
  adminNotes?: string;
};

type Message = {
  id: string;
  text: string;
  isAdmin: boolean;
  timestamp: string;
};

type Props = {
  navigation: any;
  route: {
    params: {
      requestId: string;
      request: CustomRequest;
    };
  };
};

const mockMessages: Message[] = [
  {
    id: "1",
    text: "Thank you for your custom request! We're reviewing your requirements.",
    isAdmin: true,
    timestamp: "Dec 15, 2024 • 2:30 PM",
  },
  {
    id: "2",
    text: "Great! I'm looking for organic quinoa, preferably Nature Fresh brand if available.",
    isAdmin: false,
    timestamp: "Dec 15, 2024 • 2:32 PM",
  },
  {
    id: "3",
    text: "Perfect! We found Nature Fresh organic quinoa. Based on current market prices, we can offer it at ₦24.99 for 2kg. This includes our quality guarantee.",
    isAdmin: true,
    timestamp: "Dec 15, 2024 • 3:15 PM",
  },
  {
    id: "4",
    text: "Admin is reviewing your request",
    isAdmin: true,
    timestamp: "Dec 15, 2024 • 3:16 PM",
  },
];

export default function RequestDetailsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { request } = route.params;
  const { acceptQuote, declineQuote, fetchRequests } = useCustomRequestStore();
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "submitted":
        return "#F59E0B";
      case "under_review":
        return "#60A5FA";
      case "quote_sent":
        return "#10B981";
      case "customer_accepted":
        return "#3B82F6";
      case "approved":
        return "#10B981";
      case "customer_declined":
        return "#EF4444";
      case "cancelled":
        return "#EF4444";
      case "in_cart":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case "submitted":
        return "Request Submitted - We're reviewing your request";
      case "under_review":
        return "Under Review - Our team is preparing your quote";
      case "quote_sent":
        return "Quote Ready - Review and accept/decline your quote";
      case "customer_accepted":
        return "Quote Accepted - Added to your cart";
      case "approved":
        return "Order Confirmed - Your custom order is being prepared";
      case "customer_declined":
        return "Quote Declined - Request closed";
      case "cancelled":
        return "Request Cancelled";
      case "in_cart":
        return "In Cart";
      default:
        return "Unknown";
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim()) {
      try {
        // Add message to local state immediately for better UX
        const newMessage: Message = {
          id: Date.now().toString(),
          text: messageText.trim(),
          isAdmin: false,
          timestamp: new Date().toLocaleString(),
        };
        setMessages([...messages, newMessage]);
        setMessageText("");
        
        // Send message via store
        // Note: This would need to be implemented with proper store integration
        // await customRequestStore.sendMessage(request.id, messageText.trim());
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleAcceptQuote = async () => {
    try {
      const success = await acceptQuote(request.id);
      if (success) {
        // Add to cart and navigate to checkout
        navigation.navigate("Checkout", {
          customRequest: request,
          total: request.adminQuote || 0,
        });
      }
    } catch (error) {
      console.error('Failed to accept quote:', error);
    }
  };

  const handleDeclineQuote = async () => {
    try {
      const success = await declineQuote(request.id);
      if (success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to decline quote:', error);
    }
  };

  const statusColor = getStatusColor(request.status);
  const statusText = getStatusText(request.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Request #{request.id}</Text>
        <Pressable style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Request Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.requestId, { color: colors.text }]}>Request Details</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.sub }]}>Title</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{request.title}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.sub }]}>Description</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={3}>{request.description}</Text>
            </View>
            
            {(request.quantity || request.unit) && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.sub }]}>Quantity</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{`${request.quantity || ''}${request.unit ? ` ${request.unit}` : ''}`}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.sub }]}>Delivery to</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>Home Address</Text>
            </View>
            
            {request.preferredBrand && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.sub }]}>Preferred Brand</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{request.preferredBrand}</Text>
              </View>
            )}
            

          </View>
        </View>

        {/* Quote Section */}
        {request.status === "quote_sent" && typeof request.adminQuote === 'number' && (
          <View style={[styles.quoteCard, { backgroundColor: "#10B981" + "10", borderColor: "#10B981" + "30" }]}>
            <View style={styles.quoteHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.quoteTitle, { color: "#10B981" }]}>Quote Ready</Text>
            </View>
            <Text style={[styles.quoteSubtitle, { color: colors.sub }]}>Admin has reviewed your request</Text>
            <Text style={[styles.quoteAmount, { color: colors.text }]}>Admin Quote</Text>
            <Text style={[styles.quotePrice, { color: colors.text }]}>{money(request.adminQuote || 0)}</Text>
            
            <View style={styles.quoteActions}>
              <Pressable
                style={[styles.declineBtn, { borderColor: colors.border }]}
                onPress={handleDeclineQuote}
              >
                <Text style={[styles.declineBtnText, { color: colors.text }]}>Decline</Text>
              </Pressable>
              <Pressable
                style={[styles.acceptBtn, { backgroundColor: "#FF7A2F" }]}
                onPress={handleAcceptQuote}
              >
                <Ionicons name="lock-closed" size={16} color="white" />
                <Text style={styles.acceptBtnText}>Accept & Checkout</Text>
              </Pressable>
            </View>
          </View>
        )}
        
        {/* Accepted Quote Section */}
        {request.status === "customer_accepted" && typeof request.adminQuote === 'number' && (
          <View style={[styles.quoteCard, { backgroundColor: "#10B981" + "10", borderColor: "#10B981" + "30" }]}>
            <View style={styles.quoteHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.quoteTitle, { color: "#10B981" }]}>Quote Accepted</Text>
            </View>
            <Text style={[styles.quoteSubtitle, { color: colors.sub }]}>You have accepted this quote</Text>
            <Text style={[styles.quoteAmount, { color: colors.text }]}>Accepted Amount</Text>
            <Text style={[styles.quotePrice, { color: colors.text }]}>{money(request.adminQuote || 0)}</Text>
          </View>
        )}

        {/* Messages */}
        <View style={[styles.messagesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.messagesTitle, { color: colors.text }]}>Messages</Text>
          
          <View style={styles.messagesList}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageItem,
                  message.isAdmin ? styles.adminMessage : styles.userMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.messageAvatar}>
                    {message.isAdmin ? (
                      <View style={[styles.adminAvatar, { backgroundColor: "#10B981" }]}>
                        <Ionicons name="person" size={12} color="white" />
                      </View>
                    ) : (
                      <View style={[styles.userAvatar, { backgroundColor: "#FF7A2F" }]}>
                        <Text style={styles.avatarText}>You</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.messageSender, { color: colors.text }]}>
                      {message.isAdmin ? "Admin" : "You"}
                    </Text>
                    <Text style={[styles.messageTime, { color: colors.sub }]}>{message.timestamp}</Text>
                  </View>
                </View>
                <Text style={[styles.messageText, { color: colors.text }]}>{message.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Message Input */}
      <View style={[styles.messageInput, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.sub}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: messageText.trim() ? "#FF7A2F" : colors.border }]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={16} color={messageText.trim() ? "white" : colors.sub} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  moreBtn: {
    padding: 4,
  },
  detailsCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  requestId: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  quoteCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  quoteSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  quoteAmount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  quotePrice: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  quoteActions: {
    flexDirection: "row",
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  acceptBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  messagesCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  messagesList: {
    gap: 16,
  },
  messageItem: {
    padding: 12,
    borderRadius: 12,
  },
  adminMessage: {
    backgroundColor: "#F3F4F6",
  },
  userMessage: {
    backgroundColor: "#FEF3E2",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  messageAvatar: {
    marginRight: 8,
  },
  adminAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 8,
    fontWeight: "700",
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "600",
  },
  messageTime: {
    fontSize: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageInput: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});