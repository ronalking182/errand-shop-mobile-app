import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useCustomRequestStore, CustomRequestStatus, CustomRequestItem } from "../../store/customRequest.store";
import { useCartStore } from "../../store/cart.store";

// Money formatting function with comma separators
function money(v: number | string, ccy: "NGN" | "USD" = "NGN") {
  // Convert string to number if needed
  const numValue = typeof v === 'string' ? parseFloat(v) || 0 : v;
  return `${ccy === "USD" ? "$" : "₦"}${numValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Props = {
  navigation: any;
};

export default function MyRequestsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  
  const { requests, fetchRequests, acceptQuote, declineQuote, isLoading } = useCustomRequestStore();
  const { addCustomRequest } = useCartStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const getStatusColor = (status: CustomRequestStatus) => {
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

  const getStatusText = (status: CustomRequestStatus) => {
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

  const handleRequestPress = (request: CustomRequestItem) => {
    navigation.navigate("RequestDetails", { requestId: request.id, request });
  };

  const handleAcceptQuote = async (requestId: string) => {
    try {
      console.log('Accept quote clicked for request:', requestId);
      const request = requests.find(r => r.id === requestId);
      console.log('Found request:', request);
      console.log('Request adminQuote:', request?.adminQuote, typeof request?.adminQuote);
      
      if (request && typeof request.adminQuote === 'number') {
        console.log('Accepting quote with amount:', request.adminQuote);
        await acceptQuote(requestId);
        // Add to cart with the admin quote price
        const updatedRequest = { ...request, cartPrice: request.adminQuote, isInCart: true };
        addCustomRequest(updatedRequest);
        Alert.alert("Success", `Quote accepted and added to cart! Amount: ₦${request.adminQuote}`);
      } else {
        console.log('Invalid quote - request:', !!request, 'adminQuote type:', typeof request?.adminQuote);
        Alert.alert("Error", "No valid quote found for this request.");
      }
    } catch (error) {
      console.error('Accept quote error:', error);
      Alert.alert("Error", "Failed to accept quote. Please try again.");
    }
  };

  const handleDeclineQuote = async (requestId: string) => {
    Alert.alert(
      "Decline Quote",
      "Once you decline this quote, it will be removed from your cart. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await declineQuote(requestId);
              Alert.alert("Quote Declined", "The quote has been declined and removed.");
            } catch (error) {
              Alert.alert("Error", "Failed to decline quote. Please try again.");
            }
          }
        }
      ]
    );
  };

  const renderRequest = (request: CustomRequestItem) => {
    const statusColor = getStatusColor(request.status);
    const statusText = getStatusText(request.status);

    return (
      <Pressable
        key={request.id}
        style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleRequestPress(request)}
      >
        <View style={styles.requestHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.requestId, { color: colors.text }]}>Request #{request.id}</Text>
            <Text style={[styles.requestDate, { color: colors.sub }]}>{new Date(request.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.requestContent}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]}>{request.title}</Text>
            <Text style={[styles.requestDescription, { color: colors.sub }]} numberOfLines={2}>{request.description}</Text>
            {(request.quantity || request.unit) && (
              <Text style={[styles.itemQuantity, { color: colors.sub }]}>
                Quantity: {`${request.quantity || ''}${request.unit ? ` ${request.unit}` : ''}`}
              </Text>
            )}
            {request.preferredBrand && (
              <Text style={[styles.itemBrand, { color: colors.sub }]}>Brand: {request.preferredBrand}</Text>
            )}

          </View>

          {request.status === "quote_sent" && typeof request.adminQuote === 'number' && (
            <View style={styles.quoteSection}>
              <View style={[styles.quoteCard, { backgroundColor: "#10B981" + "10", borderColor: "#10B981" + "30" }]}>
                <View style={styles.quoteHeader}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.quoteLabel, { color: "#10B981" }]}>Quote Ready</Text>
                </View>
                <Text style={[styles.quoteAmount, { color: colors.text }]}>Admin Quote: {money(request.adminQuote)}</Text>
              </View>
              
              <View style={styles.quoteActions}>
                <Pressable
                  style={[styles.declineBtn, { borderColor: colors.border }]}
                  onPress={() => handleDeclineQuote(request.id)}
                >
                  <Text style={[styles.declineBtnText, { color: colors.text }]}>Decline</Text>
                </Pressable>
                <Pressable
                  style={[styles.acceptBtn, { backgroundColor: "#FF7A2F" }]}
                  onPress={() => handleAcceptQuote(request.id)}
                >
                  <Text style={styles.acceptBtnText}>Accept & Checkout</Text>
                </Pressable>
              </View>
            </View>
          )}
          
          {/* Show accepted quote amount for customer_accepted status */}
          {request.status === "customer_accepted" && (request.cartPrice || request.adminQuote) && (
            <View style={styles.quoteSection}>
              <View style={[styles.quoteCard, { backgroundColor: "#10B981" + "10", borderColor: "#10B981" + "30" }]}>
                <View style={styles.quoteHeader}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.quoteLabel, { color: "#10B981" }]}>Quote Accepted</Text>
                </View>
                <Text style={[styles.quoteAmount, { color: colors.text }]}>Accepted Amount: {money(request.cartPrice || request.adminQuote || 0)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.requestFooter}>
          <Pressable style={styles.viewDetailsBtn}>
            <Text style={[styles.viewDetailsText, { color: "#FF7A2F" }]}>View Details & Messages</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF7A2F" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const activeRequests = requests.filter((r: CustomRequestItem) => r.status !== "approved");
  const completedRequests = requests.filter((r: CustomRequestItem) => r.status === "approved");

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Requests</Text>
        <Pressable onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: "#F3F4F6" }]}>
        <View style={styles.tabWrapper}>
          <Pressable
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === "active" ? "#FF7A2F" : "transparent",
              },
            ]}
            onPress={() => setActiveTab("active")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "active" ? "white" : "#6B7280",
                  fontWeight: activeTab === "active" ? "700" : "500",
                },
              ]}
            >
              Active ({activeRequests.length})
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === "completed" ? "#FF7A2F" : "transparent",
              },
            ]}
            onPress={() => setActiveTab("completed")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "completed" ? "white" : "#6B7280",
                  fontWeight: activeTab === "completed" ? "700" : "500",
                },
              ]}
            >
              Completed ({completedRequests.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7A2F']}
            tintColor={'#FF7A2F'}
          />
        }
      >
        {activeTab === "active" ? (
          activeRequests.length > 0 ? (
            activeRequests.map(renderRequest)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.sub} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Requests</Text>
              <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
                You don't have any active custom requests at the moment.
              </Text>
              <Pressable
                style={[styles.createRequestBtn, { backgroundColor: "#FF7A2F" }]}
                onPress={() => navigation.navigate("CustomRequest")}
              >
                <Text style={styles.createRequestText}>Create New Request</Text>
              </Pressable>
            </View>
          )
        ) : (
          completedRequests.length > 0 ? (
            completedRequests.map(renderRequest)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.sub} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Completed Requests</Text>
              <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
                Your completed custom requests will appear here.
              </Text>
            </View>
          )
        )}
      </ScrollView>
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
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
  },
  requestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  requestId: {
    fontSize: 16,
    fontWeight: "700",
  },
  requestDate: {
    fontSize: 12,
    marginTop: 2,
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
  requestContent: {
    marginBottom: 12,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  itemQuantity: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemBudget: {
    fontSize: 14,
  },
  quoteSection: {
    marginTop: 12,
  },
  quoteCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  quoteAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  quoteActions: {
    flexDirection: "row",
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
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
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  createRequestBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createRequestText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});