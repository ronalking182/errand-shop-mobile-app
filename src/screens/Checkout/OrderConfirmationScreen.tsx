import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useOrdersStore } from "../../store/orders.store";

type Props = {
  navigation: any;
  route: {
    params: {
      orderNumber: string;
      total: number;
      items: any[];
      customRequests?: any[];
      customRequestDetails?: any[];
      deliveryAddress?: any;
      deliveryMode?: 'home' | 'pickup';
    };
  };
};

export default function OrderConfirmationScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { orderConfirmationData } = useOrdersStore();
  
  // Get data from store first, fallback to route params
  const orderNumber = orderConfirmationData?.orderNumber || route.params?.orderNumber || 'N/A';
  const total = orderConfirmationData?.total || route.params?.total || 0;
  const items = orderConfirmationData?.items || route.params?.items || [];
  const customRequests = orderConfirmationData?.customRequestDetails || route.params?.customRequestDetails || [];
  const deliveryAddress = orderConfirmationData?.deliveryAddress || route.params?.deliveryAddress;
  const deliveryMode = orderConfirmationData?.deliveryMode || route.params?.deliveryMode || 'home';
  


  const handleTrackOrder = () => {
    navigation.navigate("Orders");
  };

  const handleContinueShopping = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.navigate("Home")} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Confirmed</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: "#22C55E" }]}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={[styles.successTitle, { color: colors.text }]}>Order Confirmed!</Text>
        <Text style={[styles.successSubtitle, { color: colors.sub }]}>Your order has been placed successfully</Text>

        {/* Order Number */}
        <View style={styles.orderNumberContainer}>
          <Text style={[styles.orderNumberLabel, { color: colors.sub }]}>Order Number</Text>
          <Text style={[styles.orderNumber, { color: "#EF4444" }]}>#{orderNumber}</Text>
        </View>

        {/* Delivery Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Details</Text>
          
          <View style={styles.deliveryRow}>
            <View style={[styles.deliveryIcon, { backgroundColor: deliveryMode === 'pickup' ? "#FEF3C7" : "#FEE2E2" }]}>
              <Ionicons 
                name={deliveryMode === 'pickup' ? "storefront" : "home"} 
                size={16} 
                color={deliveryMode === 'pickup' ? "#F59E0B" : "#EF4444"} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deliveryTitle, { color: colors.text }]}>
                {deliveryMode === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
              </Text>
              <Text style={[styles.deliverySubtitle, { color: colors.sub }]}>
                {deliveryMode === 'pickup' 
                  ? 'Expected pickup time: 30-45 minutes' 
                  : 'Expected delivery time: 2-4 hours'
                }
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusIndicator, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="time" size={12} color="#22C55E" />
            <Text style={[styles.statusText, { color: "#22C55E" }]}>Preparing your order...</Text>
          </View>
          
          {deliveryMode === 'home' ? (
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={16} color="#EF4444" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.addressTitle, { color: colors.text }]}>Delivery Address</Text>
                {deliveryAddress ? (
                  <>
                    <Text style={[styles.addressText, { color: colors.sub }]}>{deliveryAddress.street}</Text>
                    <Text style={[styles.addressText, { color: colors.sub }]}>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.postal_code}</Text>
                    <Text style={[styles.addressText, { color: colors.sub }]}>{deliveryAddress.country}</Text>
                  </>
                ) : (
                  <Text style={[styles.addressText, { color: colors.sub }]}>No delivery address provided</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.addressContainer}>
              <Ionicons name="storefront" size={16} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.addressTitle, { color: colors.text }]}>Pickup Location</Text>
                <Text style={[styles.addressText, { color: colors.sub }]}>Shop 102, Ikeja Store WUYE</Text>
                <Text style={[styles.addressText, { color: colors.sub }]}>Lagos, Nigeria</Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          
          {/* Display regular order items */}
          {items && items.length > 0 && (
            items.map((item: any, index: number) => (
              <View key={`item-${index}`} style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>
                  {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ₦{(item.price * item.quantity).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            ))
          )}
          
          {/* Display custom request items */}
          {customRequests && customRequests.length > 0 && (
            customRequests.map((request: any, index: number) => (
              <View key={`custom-${index}`} style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>
                  {request.title} (Custom Request) {(request.cartQuantity || request.quantity) > 1 && `(x${request.cartQuantity || request.quantity})`}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ₦{(request.cartPrice || request.adminQuote || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            ))
          )}
          
          {/* Show message if no items */}
          {(!items || items.length === 0) && (!customRequests || customRequests.length === 0) && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>No items found</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₦0</Text>
            </View>
          )}
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₦{(() => {
              const itemsTotal = items && items.length > 0 ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
              const customRequestsTotal = customRequests && customRequests.length > 0 ? customRequests.reduce((sum, request) => sum + ((request.cartPrice || request.adminQuote || 0) * (request.quantity || 1)), 0) : 0;
              return (itemsTotal + customRequestsTotal).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            })()}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₦500</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: "#22C55E" }]}>Discount (10%)</Text>
            <Text style={[styles.summaryValue, { color: "#22C55E" }]}>-₦260</Text>
          </View>
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <View style={styles.summaryItem}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: "#EF4444" }]}>₦{typeof total === 'number' && !isNaN(total) ? total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Information</Text>
          
          <View style={styles.paymentRow}>
            <View style={[styles.paymentIcon, { backgroundColor: "#EF4444" }]}>
              <Ionicons name="cash" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.paymentTitle, { color: colors.text }]}>Cash on Delivery</Text>
              <Text style={[styles.paymentSubtitle, { color: colors.sub }]}>Pay when you receive your order</Text>
              <Text style={[styles.paymentSubtitle, { color: colors.sub }]}>Order Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={[styles.paidBadge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[styles.paidText, { color: "#F59E0B" }]}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Track Your Order */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Track Your Order</Text>
          
          <View style={styles.trackingStep}>
            <View style={[styles.stepIcon, { backgroundColor: "#22C55E" }]}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Order Confirmed</Text>
              <Text style={[styles.stepTime, { color: colors.sub }]}>2:45 PM</Text>
            </View>
          </View>
          
          <View style={styles.trackingStep}>
            <View style={[styles.stepIcon, { backgroundColor: "#F59E0B" }]}>
              <Ionicons name="time" size={12} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Preparing Order</Text>
              <Text style={[styles.stepSubtitle, { color: colors.sub }]}>In progress...</Text>
            </View>
          </View>
          
          <View style={styles.trackingStep}>
            <View style={[styles.stepIcon, { backgroundColor: colors.border }]}>
              <Ionicons name="car" size={12} color={colors.sub} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.sub }]}>Out for Delivery</Text>
              <Text style={[styles.stepSubtitle, { color: colors.sub }]}>Pending</Text>
            </View>
          </View>
          
          <View style={styles.trackingStep}>
            <View style={[styles.stepIcon, { backgroundColor: colors.border }]}>
              <Ionicons name="checkmark-done" size={12} color={colors.sub} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.sub }]}>Delivered</Text>
              <Text style={[styles.stepSubtitle, { color: colors.sub }]}>Pending</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[styles.trackButton, { backgroundColor: "#EF4444" }]} onPress={handleTrackOrder}>
          <Text style={styles.trackButtonText}>Track Order</Text>
        </Pressable>
        
        <Pressable style={[styles.continueButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleContinueShopping}>
          <Text style={[styles.continueButtonText, { color: colors.text }]}>Continue Shopping</Text>
        </Pressable>
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
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  successContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  orderNumberContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  orderNumberLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "800",
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deliveryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  deliverySubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    marginTop: 2,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  paymentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trackingStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepTime: {
    fontSize: 12,
    marginTop: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  trackButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  continueButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
});