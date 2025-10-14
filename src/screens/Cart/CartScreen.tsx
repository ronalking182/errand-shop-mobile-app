
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useCartStore } from "../../store/cart.store";
import { useNavigationAdapter } from "../../hooks/useNavigationAdapter";
import { useTheme } from "../../theme/ThemeProvider";
import CouponSelector from "../../components/CouponSelector";
import { useCustomRequestStore } from "../../store/customRequest.store";
import { apiService } from "../../services/apiService";

function money(v: number | string, ccy: "NGN" | "USD" = "NGN") {
  // Convert string to number if needed
  const numValue = typeof v === 'string' ? parseFloat(v) || 0 : v;
  return `${ccy === "USD" ? "$" : "₦"}${numValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CartScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationAdapter();
  const { items, customRequests, removeItem, removeCustomRequest, hideCustomRequest, updateQuantity, clearCart, itemCount, totalPrice, customRequestsTotal, getGrandTotal, hasPendingCustomRequests, isLoaded, loadCartFromStorage, addCustomRequest, incrementCustomRequest, decrementCustomRequest } = useCartStore();
  const { requests, fetchRequests } = useCustomRequestStore();
  const [code, setCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Load cart data when component mounts
  useEffect(() => {
    if (!isLoaded) {
      loadCartFromStorage();
    }
  }, [isLoaded, loadCartFromStorage]);

  // Sync custom requests when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const syncCustomRequests = () => {
        // Update cart custom requests with latest status from custom request store
        // Only sync if we have both cart requests and store requests
        if (customRequests.length > 0 && requests.length > 0) {
          customRequests.forEach(cartRequest => {
            const latestRequest = requests.find(r => r.id === cartRequest.id);
            if (latestRequest && latestRequest.status !== cartRequest.status) {
              console.log('🔄 Syncing custom request status:', {
                requestId: cartRequest.id,
                oldStatus: cartRequest.status,
                newStatus: latestRequest.status
              });
              // Update the cart with the latest request data
              addCustomRequest({
                ...latestRequest,
                isInCart: true,
                cartPrice: latestRequest.status === 'customer_accepted' ? latestRequest.adminQuote || 0 : latestRequest.cartPrice || 0
              });
            }
          });
        }
      };
      
      syncCustomRequests();
    }, [customRequests, requests, addCustomRequest])
  );

  const summary = useMemo(() => {
    const compare = items.reduce(
      (s: number, it) => s + (it.price * 1.4) * it.quantity, // Assuming 40% markup for compareAt
      0
    );
    const subtotal = totalPrice;
    const customRequestsSubtotal = customRequestsTotal;
    const grandTotal = getGrandTotal();
    const finalTotal = Math.max(0, grandTotal - discountAmount);
    const saved = Math.max(0, compare - finalTotal);
    const weight = items.reduce((s, it) => s + (0.5) * it.quantity, 0); // Assuming 0.5 lbs per item
    const ccy = "NGN";
    return { total: finalTotal, subtotal, customRequestsSubtotal, compare, saved, weight, ccy, discount: discountAmount };
  }, [items, totalPrice, customRequestsTotal, discountAmount, getGrandTotal]);

  // Show loading state while cart data is being loaded from storage
  if (!isLoaded) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[{ color: colors.text, fontSize: 16 }]}>Loading cart...</Text>
      </View>
    );
  }

  const inc = (id: string) => {
    const item = items.find(it => it.id === id);
    if (item) {
      updateQuantity(id, item.quantity + 1);
    }
  };
  
  const dec = (id: string) => {
    const item = items.find(it => it.id === id);
    if (item) {
      updateQuantity(id, Math.max(1, item.quantity - 1));
    }
  };
  
  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };
  
  const clearAll = () => {
    Alert.alert("Clear cart?", "Remove all items from your cart.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearCart() },
    ]);
  };

  const applyCode = () => {
    // TODO: validate promo code via API
    if (!code.trim()) return;
    Alert.alert("Promo applied", `Code ${code.toUpperCase()} applied (demo).`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh cart data if needed - cart is typically managed locally
      // But we can refresh custom requests from the server
      const { fetchRequests } = useCustomRequestStore.getState();
      await fetchRequests();
    } catch (error) {
      console.error('Error refreshing cart data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const checkout = () => {
    if (!items.length && !customRequests.length) return;
    
    // Check for pending custom requests
    if (hasPendingCustomRequests()) {
      Alert.alert(
        "Pending Custom Requests",
        "You have custom requests that are still pending approval. Please wait for admin confirmation before proceeding to checkout.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Check for unaccepted quotes
    const unacceptedQuotes = customRequests.filter(cr => cr.status === 'quote_sent');
    if (unacceptedQuotes.length > 0) {
      Alert.alert(
        "Unaccepted Quotes",
        "You have custom requests with quotes that need to be accepted before checkout. Please review and accept the quotes first.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Navigate to checkout screen
    navigation.navigate("Checkout");
  };

  const handleRemoveCustomRequest = (id: string) => {
    const request = customRequests.find(cr => cr.id === id);
    if (!request) return;
    
    // Status-based deletion logic based on backend recommendations
    const canDelete = ['submitted', 'under_review', 'quote_sent'].includes(request.status);
      const canRemoveFromCart = ['customer_accepted', 'in_cart'].includes(request.status);
      const preventDeletion = ['approved'].includes(request.status);
    
    if (preventDeletion) {
      Alert.alert(
        "Cannot Remove",
        "This custom request cannot be removed as it has been approved or completed.",
        [{ text: "OK" }]
      );
      return;
    }
    
    if (canDelete) {
      Alert.alert(
        "Delete Custom Request",
        "This will permanently delete your custom request. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: async () => {
              // Call backend delete API for permanent deletion
              const response = await apiService.deleteCustomRequest(id);
              if (response.success) {
                removeCustomRequest(id);
              } else {
                Alert.alert("Error", response.message || "Failed to delete custom request");
              }
            }
          }
        ]
      );
    } else if (canRemoveFromCart) {
      Alert.alert(
        "Remove from Cart",
        request.status === 'quote_sent' 
          ? "This will remove the item from your cart but preserve the quote for future use. You can re-add it later."
          : "This will remove the item from your cart. You can re-add it later.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Remove from Cart", 
            style: "destructive", 
            onPress: async () => {
              // Use cancel endpoint for soft removal
              const response = await apiService.cancelCustomRequest(id, "Removed from cart by user");
              if (response.success) {
                removeCustomRequest(id);
              } else {
                // Fallback to local removal if API fails
                removeCustomRequest(id);
              }
            }
          }
        ]
      );
    } else {
      // Fallback for any other status
      Alert.alert(
        "Remove Custom Request",
        "Are you sure you want to remove this custom request from your cart?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Remove", 
            style: "destructive", 
            onPress: () => removeCustomRequest(id) 
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.card,
          paddingTop: insets.top + 12
        }
      ]}>
        <Pressable style={[styles.hBtn, { backgroundColor: colors.muted }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>My Cart</Text>
        <Pressable onPress={clearAll}>
          <Text style={styles.clearAll}>Clear All</Text>
        </Pressable>
      </View>

      {/* Summary row */}
      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.itemsCount, { color: colors.text }]}>
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </Text>
          {customRequests.length > 0 && (
            <Text style={[styles.itemsCount, { color: colors.text, fontSize: 12 }]}>
              + {customRequests.length} Custom Request{customRequests.length === 1 ? "" : "s"}
            </Text>
          )}
        </View>

        <View style={{ alignItems: "flex-end" }}>
          {summary.discount > 0 && (
            <Text style={[styles.originalPrice, { color: colors.sub }]}>
              {money(summary.subtotal + summary.customRequestsSubtotal, summary.ccy as "NGN" | "USD")}
            </Text>
          )}
          <Text style={[styles.totalTxt, { color: colors.text }]}>
            {money(summary.total, summary.ccy as "NGN" | "USD")}
          </Text>
          {summary.discount > 0 && (
            <Text style={[styles.savedTxt, { color: "#16A34A" }]}>
              You saved {money(summary.discount, summary.ccy as "NGN" | "USD")}
            </Text>
          )}
        </View>
      </View>

      {/* Empty state */}
      {!items.length && !customRequests.length && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={80} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.sub }]}>Add some items to get started</Text>
        </View>
      )}

      {/* Combined Items and Custom Requests */}
      <FlatList
        data={[
          ...items.map(item => ({ ...item, type: 'regular' as const })),
          ...customRequests.map(request => ({ ...request, type: 'custom' as const }))
        ]}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'regular') {
            const regularItem = item as typeof item & { name: string; price: number; image?: string; quantity: number };
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.thumb}>
                  {regularItem.image ? (
                    <Image 
                      source={{ uri: regularItem.image }} 
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons name="basket" size={28} color={colors.brand} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.pName, { color: colors.text }]} numberOfLines={1}>{regularItem.name}</Text>
                  <Text style={[styles.pSub, { color: colors.sub }]}>Product item</Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: colors.text }]}>{money(regularItem.price, summary.ccy as "NGN" | "USD")}</Text>
                  </View>
                </View>

                {/* Qty + remove */}
                <View>
                  <View style={styles.qtyRow}>
                    <Pressable onPress={() => dec(regularItem.id)} style={[styles.qtyBtn, { backgroundColor: colors.muted }]}>
                      <Ionicons name="remove" size={16} color={colors.sub} />
                    </Pressable>
                    <Text style={[styles.qtyVal, { color: colors.text }]}>{regularItem.quantity}</Text>
                    <Pressable onPress={() => inc(regularItem.id)} style={[styles.qtyBtn, styles.qtyPlus, { backgroundColor: colors.brand }]}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </Pressable>
                  </View>
                  <Pressable style={styles.trash} onPress={() => handleRemoveItem(regularItem.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.sub} />
                  </Pressable>
                </View>
              </View>
            );
          } else {
            // Custom request item
            const request = item as typeof item & { title: string; status: string; adminQuote?: number; cartPrice?: number; productImages?: string[] };

            const statusColor = request.status === 'submitted' ? '#F59E0B' : 
                                request.status === 'customer_accepted' ? '#10B981' : 
                                request.status === 'quote_sent' ? '#3B82F6' : '#EF4444';
            
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Display image if available, otherwise show CR icon */}
                <View style={[styles.thumb, { backgroundColor: '#F3F4F6' }]}>
                  {request.productImages && request.productImages.length > 0 ? (
                    <Image 
                      source={{ uri: request.productImages[0] }} 
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[styles.customRequestIcon, { color: colors.brand }]}>CR</Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  {/* Show item name (title) */}
                  <Text style={[styles.pName, { color: colors.text }]} numberOfLines={1}>
                    {request.title || 'Custom Request'}
                  </Text>
                  <Text style={[styles.pSub, { color: colors.sub }]}>Custom Request</Text>
                  
                  {/* Show status badge */}
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: '#fff' }]}>
                      {request.status === 'customer_accepted' ? 'ACCEPTED' : request.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  
                  {/* Show quote amount for quote_sent status */}
                  {request.status === 'quote_sent' && typeof request.adminQuote === 'number' && (
                     <View style={styles.priceRow}>
                       <Text style={[styles.price, { color: colors.text }]}>Quote: {money(request.adminQuote, summary.ccy as "NGN" | "USD")}</Text>
                     </View>
                   )}
                   
                  {/* Show accepted quote amount for customer_accepted status - use cartPrice or adminQuote */}
                  {request.status === 'customer_accepted' && (
                     <View style={styles.priceRow}>
                       <Text style={[styles.price, { color: colors.text }]}>Accepted: {money(request.cartPrice || request.adminQuote || 0, summary.ccy as "NGN" | "USD")}</Text>
                     </View>
                   )}
                   
                  {request.status === 'submitted' && (
                    <Text style={[styles.pSub, { color: colors.sub }]}>Awaiting admin approval</Text>
                  )}
                </View>

                <View>
                  {/* Quantity controls for accepted custom requests */}
                  {request.status === 'customer_accepted' && (
                    <View style={styles.qtyRow}>
                      <Pressable onPress={() => decrementCustomRequest(request.id)} style={[styles.qtyBtn, { backgroundColor: colors.muted }]}>
                        <Ionicons name="remove" size={16} color={colors.sub} />
                      </Pressable>
                      <Text style={[styles.qtyVal, { color: colors.text }]}>{request.cartQuantity || 1}</Text>
                      <Pressable onPress={() => incrementCustomRequest(request.id)} style={[styles.qtyBtn, styles.qtyPlus, { backgroundColor: colors.brand }]}>
                        <Ionicons name="add" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  )}
                  
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {/* Hide from cart button */}
                    <Pressable 
                      style={[styles.removeButton, { backgroundColor: colors.muted, borderColor: colors.border }]} 
                      onPress={() => hideCustomRequest(request.id)}
                    >
                      <Ionicons name="eye-off-outline" size={14} color="#F59E0B" />
                      <Text style={[styles.removeButtonText, { color: "#F59E0B" }]}>Hide</Text>
                    </Pressable>
                    
                    {/* Permanent remove button */}
                    <Pressable 
                      style={[styles.removeButton, { backgroundColor: colors.muted, borderColor: colors.border }]} 
                      onPress={() => handleRemoveCustomRequest(request.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={[styles.removeButtonText, { color: "#EF4444" }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }
        }}
        ListFooterComponent={
          <>
            {/* Proceed to Checkout Button - Show when cart has items or custom requests */}
            {(items.length > 0 || customRequests.length > 0) && (
              <View style={[styles.promoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Pressable 
                  style={[styles.checkoutBtnTop, { backgroundColor: "#22C55E" }]} 
                  onPress={checkout}
                >
                  <Ionicons name="lock-closed" size={16} color="#fff" />
                  <Text style={styles.checkoutBtnTopTxt}>Proceed to Checkout</Text>
                </Pressable>
              </View>
            )}

            {/* Custom Request Card */}
            <View style={[styles.promoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.promoHead}>
                <Text style={[styles.promoTitle, { color: colors.text }]}>Custom Request</Text>
                <Ionicons name="add-circle-outline" size={16} color={colors.brand} />
              </View>
              <Pressable 
                style={[styles.customRequestBtn, { backgroundColor: colors.brand }]} 
                onPress={() => navigation.navigate('custom-request', { showForm: true })}
              >
                <Text style={styles.customRequestTxt}>Add custom request</Text>
              </Pressable>
            </View>

            {/* Coupon Selector - Show when cart has items or custom requests */}
            {(items.length > 0 || customRequests.length > 0) && (
              <CouponSelector
                cartTotal={totalPrice}
                onCouponApplied={(discount) => setDiscountAmount(discount)}
                onCouponRemoved={() => setDiscountAmount(0)}
              />
            )}
          </>
        }
      />

      {/* Sticky checkout */}
      <View style={[
        styles.sticky, 
        { 
          backgroundColor: colors.card, 
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 12
        }
      ]}>
        <Pressable 
          style={[
            styles.checkoutBtn, 
            { 
              backgroundColor: (items.length || customRequests.length) ? colors.brand : colors.muted,
              opacity: (items.length || customRequests.length) ? 1 : 0.6
            }
          ]} 
          onPress={checkout} 
          disabled={!items.length && !customRequests.length}
        >
          <Ionicons name="lock-closed" size={16} color="#fff" />
          <Text style={styles.checkoutTxt}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ——— Styles ——— */
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hBtn: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  hTitle: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: "900" },
  clearAll: { color: "#EF4444", fontWeight: "800" },

  summary: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsCount: { fontWeight: "900" },
  weightTxt: { marginTop: 2 },
  originalPrice: { 
    textDecorationLine: "line-through",
    fontSize: 14,
    fontWeight: "600"
  },
  totalTxt: { fontWeight: "900", fontSize: 18 },
  savedTxt: { color: "#16A34A", marginTop: 2, fontWeight: "700", fontSize: 12 },

  card: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    gap: 12,
  },
  thumb: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: "#FFF6F0",
    alignItems: "center", justifyContent: "center",
  },
  productImage: {
    width: 56, height: 56, borderRadius: 12,
  },
  pName: { fontWeight: "800" },
  pSub: { marginTop: 2 },

  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  price: { fontWeight: "900" },
  compare: { textDecorationLine: "line-through" },

  qtyRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", gap: 10 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  qtyPlus: {},
  qtyVal: { minWidth: 18, textAlign: "center", fontWeight: "800" },

  trash: { alignSelf: "flex-end", marginTop: 10 },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    gap: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },

  promoCard: {
    marginHorizontal: 12, marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  promoHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  promoTitle: { fontWeight: "800" },
  promoInput: {
    borderWidth: 1, borderRadius: 10, height: 44, paddingHorizontal: 12,
  },
  applyBtn: {
    marginTop: 10, alignSelf: "flex-start",
    borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  applyTxt: { color: "#fff", fontWeight: "800" },
  customRequestBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  customRequestTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },

  sticky: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopWidth: 1,
    padding: 12,
  },
  checkoutBtn: {
    height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10,
  },
  checkoutTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
  checkoutBtnTop: {
    height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10,
  },
  checkoutBtnTopTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  customRequestIcon: {
    fontSize: 14,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusText: {
     fontSize: 10,
     fontWeight: "700",
   },
   emptyContainer: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
     paddingVertical: 60,
   },
   emptyTitle: {
     fontSize: 18,
     fontWeight: "600",
     marginTop: 16,
   },
   emptySubtitle: {
     fontSize: 14,
     marginTop: 8,
     textAlign: "center",
   },
 });
