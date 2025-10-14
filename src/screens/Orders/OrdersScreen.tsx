import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Switch } from "react-native";
import { useOrdersStore } from "../../store/orders.store";
import { useProductStore } from "../../store/product.store";
import { useTheme } from "../../theme/ThemeProvider";
import { Order, CustomRequestDetail, CustomRequestItem } from "../../services/apiService";
import { authService } from "../../services/authService";

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  if (!status) return { bg: '#F3F4F6', text: '#6B7280' };
  switch (status.toLowerCase()) {
    case 'pending':
    case 'preparing':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'confirmed':
    case 'in_transit':
    case 'in transit':
    case 'out_for_delivery':
      return { bg: '#DBEAFE', text: '#2563EB' };
    case 'delivered':
      return { bg: '#D1FAE5', text: '#059669' };
    case 'cancelled':
      return { bg: '#FEE2E2', text: '#DC2626' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) {
    return 'Date not available';
  }
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to get order actions based on status
const getOrderActions = (status: string) => {
  if (!status) return ['support'];
  switch (status.toLowerCase()) {
    case 'pending':
    case 'confirmed':
      return ['support'];
    case 'in_transit':
    case 'in transit':
    case 'out_for_delivery':
      return ['track', 'support'];
    case 'delivered':
      return ['reorder', 'support'];
    case 'cancelled':
      return ['reorder'];
    default:
      return ['support'];
  }
};

  const handleOrderAction = (action: string, order: any) => {
    switch (action) {
      case 'support':
        // Navigate to support screen
        console.log('Contact support for order:', order.id);
        break;
      case 'track':
        // Navigate to tracking screen
        console.log('Track order:', order.id);
        break;
      case 'reorder':
        // Navigate to reorder screen
        console.log('Reorder:', order.id);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

export default function OrdersListScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<"active" | "completed" | "cancelled">("active");
  const { orders, loading, error, fetchOrders } = useOrdersStore();
  const { products, fetchProducts } = useProductStore();
  const [productDetails, setProductDetails] = useState<{[key: string]: any}>({});
  const [expandedOrders, setExpandedOrders] = useState<{[key: string]: boolean}>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchOrders = async () => {
      console.log('🔄 OrdersScreen - Component mounted, checking auth status...');
      
      // Check authentication status
      const isLoggedIn = await authService.isLoggedIn();
      const token = await authService.getToken();
      const userData = await authService.getUserData();
      console.log('🔐 Auth status:', {
        isLoggedIn,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        userEmail: userData?.email,
        userId: userData?.id
      });
      
      if (!isLoggedIn || !token) {
        console.log('❌ User not authenticated, cannot fetch orders');
        console.log('🔑 Please log in to view your orders');
        setIsAuthenticated(false);
        return;
      }
      
      console.log('✅ User authenticated, fetching orders...');
      setIsAuthenticated(true);
      fetchOrders();
      fetchProducts(); // Fetch products to get names
    };
    
    checkAuthAndFetchOrders();
  }, []);

  // Debug: Log orders data structure
  useEffect(() => {
    if (orders.length > 0) {
      console.log('📋 ORDERS DEBUG - Total orders:', orders.length);
      orders.forEach((order, index) => {
        console.log(`📋 Order ${index + 1}:`, {
          id: order.id,
          status: order.status,
          hasCustomRequestDetails: !!order.customRequestDetails,
          customRequestDetailsLength: order.customRequestDetails?.length || 0,
          hasCustomRequests: !!order.custom_requests,
          customRequestsLength: order.custom_requests?.length || 0,
          customRequestDetails: order.customRequestDetails,
          customRequests: order.custom_requests
        });
      });
    }
  }, [orders]);

  // Stable fetchOrders function to prevent useEffect re-runs
  const stableFetchOrders = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Refresh orders when screen comes into focus (e.g., from order confirmation)
  useFocusEffect(
    useCallback(() => {
      stableFetchOrders();
    }, [stableFetchOrders])
  );

  // Add periodic refresh for real-time order status updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let interval: number | null = null;

    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        stableFetchOrders();
      }, 45000); // Refresh every 45 seconds when enabled
    }
    // When autoRefreshEnabled is false, no polling happens

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, autoRefreshEnabled, stableFetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
      await fetchProducts();
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to get product name by ID
  const getProductName = (productId: string) => {
    if (productDetails[productId]) {
      return productDetails[productId].name;
    }
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product ID: ${productId}`;
  };

  // Filter orders based on selected tab
  const filteredOrders = orders.filter(order => {
    if (!order.status) return false;
    const status = order.status.toLowerCase();
    switch (tab) {
      case 'active':
        return ['pending', 'confirmed', 'preparing', 'in_transit', 'in transit', 'out_for_delivery'].includes(status);
      case 'completed':
        return status === 'delivered';
      case 'cancelled':
        return status === 'cancelled';
      default:
        return false;
    }
  });

  const renderTab = (label: string, key: "active" | "completed" | "cancelled") => {
    const isActive = tab === key;
    return (
      <Pressable
        onPress={() => setTab(key)}
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? "#FF7A2F" : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: isActive ? "#FFFFFF" : "#6B7280",
              fontWeight: isActive ? "700" : "500",
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: 40, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.hTitle, { color: colors.text }]}>My Orders</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>Auto</Text>
          <Switch
            value={autoRefreshEnabled}
            onValueChange={setAutoRefreshEnabled}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor={autoRefreshEnabled ? '#fff' : '#f4f3f4'}
            ios_backgroundColor={colors.border}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Tab Container */}
      <View style={[styles.tabContainer, { backgroundColor: "#F3F4F6" }]}>
        <View style={styles.tabWrapper}>
          {renderTab("Active", "active")}
          {renderTab("Completed", "completed")}
          {renderTab("Cancelled", "cancelled")}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        }
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={{ color: colors.sub, marginTop: 16 }}>Loading orders...</Text>
          </View>
        ) : isAuthenticated === false ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.sub} />
            <Text style={{ color: colors.text, marginTop: 16, fontSize: 18, fontWeight: '600' }}>Please Log In</Text>
            <Text style={{ color: colors.sub, marginTop: 8, textAlign: 'center' }}>You need to log in to view your orders.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Pressable 
                style={[styles.orangeBtn, { backgroundColor: colors.brand, paddingHorizontal: 24 }]}
                onPress={() => router.push('/login')}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Log In</Text>
              </Pressable>
              <Pressable 
                style={[styles.greyBtn, { backgroundColor: '#6B7280', paddingHorizontal: 24 }]}
                onPress={async () => {
                  console.log('🧪 Testing quick login...');
                  // Quick test login
                  try {
                    const response = await fetch('https://errand-shop-backend.onrender.com/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
                    });
                    const data = await response.json();
                    console.log('🧪 Test login response:', data);
                    if (data.success && data.token) {
                       await authService.setLoggedIn(true, data.token, data.refreshToken, data.user);
                       console.log('🧪 Test login successful, refetching orders...');
                       setIsAuthenticated(true);
                       fetchOrders();
                     }
                  } catch (error) {
                    console.error('🧪 Test login failed:', error);
                  }
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Test Login</Text>
              </Pressable>
            </View>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.sub} />
            <Text style={{ color: colors.text, marginTop: 16, textAlign: 'center' }}>Failed to load orders</Text>
            <Text style={{ color: colors.sub, marginTop: 8, textAlign: 'center' }}>{error}</Text>
            <Pressable 
              style={[styles.orangeBtn, { backgroundColor: colors.brand, marginTop: 16, paddingHorizontal: 24 }]}
              onPress={fetchOrders}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
            <Ionicons name="receipt-outline" size={48} color={colors.sub} />
            <Text style={{ color: colors.text, marginTop: 16, fontSize: 18, fontWeight: '600' }}>No {tab} orders</Text>
            <Text style={{ color: colors.sub, marginTop: 8, textAlign: 'center' }}>You don't have any {tab} orders yet.</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusColors = getStatusColor(order.status);
            const actions = getOrderActions(order.status);
            
            return (
              <View key={order.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>Order #{order.order_number || order.id.slice(-8)}</Text>
                    <Text style={{ color: colors.sub, marginTop: 2, fontSize: 14 }}>Placed on {formatDate(order.created_at || order.createdAt || '')}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusColors.bg, flexShrink: 0 }]}>
                    <Text style={{ color: statusColors.text, fontSize: 11, fontWeight: '600' }}>
                      {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                </View>

                {/* items */}
                {order.items && order.items.length > 0 && (
                  <View>
                    {/* Show first item or all items if expanded */}
                    {(expandedOrders[order.id] ? order.items : order.items.slice(0, 1)).map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <View style={[styles.itemIcon, { backgroundColor: "#F1F5F9" }]}>
                          {item.product?.imageUrl ? (
                             <Image 
                               source={{ uri: item.product.imageUrl }} 
                               style={{ width: '100%', height: '100%', borderRadius: 12 }}
                               resizeMode="cover"
                             />
                           ) : (
                             <MaterialCommunityIcons name="package-variant" size={20} color="#FF7A2F" />
                           )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "800" }}>{item.product?.name || getProductName(item.productId || '')}</Text>
                          <Text style={{ color: colors.sub, marginTop: 2 }}>Quantity: {item.quantity} • ₦{(item.unitPriceNaira || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</Text>
                        </View>
                        <Text style={{ color: colors.text, fontWeight: "800" }}>₦{(item.totalPriceNaira || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                      ))}
                    
                    {/* Show expand/collapse button if more than 1 item */}
                    {order.items.length > 1 && (
                      <Pressable 
                        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, marginTop: 8 }}
                        onPress={() => setExpandedOrders(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                      >
                        <Text style={{ color: colors.brand, fontSize: 14, fontWeight: "600", marginRight: 4 }}>
                          {expandedOrders[order.id] ? 'Show Less' : `Show ${order.items.length - 1} More Item${order.items.length > 2 ? 's' : ''}`}
                        </Text>
                        <Ionicons 
                          name={expandedOrders[order.id] ? "chevron-up" : "chevron-down"} 
                          size={16} 
                          color={colors.brand} 
                        />
                      </Pressable>
                    )}
                  </View>
                )}

                {/* custom requests */}
                {order.customRequestDetails && order.customRequestDetails.length > 0 && (
                  <View>
                    <View style={{ marginTop: 12, marginBottom: 8 }}>
                      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>Custom Requests</Text>
                    </View>
                    {order.customRequestDetails.map((customRequest: CustomRequestDetail, idx: number) => {
                      // Find the corresponding quantity from custom_requests array
                      const customRequestQuantity = order.custom_requests?.find(cr => cr.custom_request_id === customRequest.id)?.quantity || 1;
                      
                      return (
                        <View key={`cr-${idx}`} style={[styles.itemRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 }}>
                          <View style={[styles.itemIcon, { backgroundColor: "#FEF3C7" }]}>
                            <MaterialCommunityIcons name="clipboard-text" size={20} color="#F59E0B" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <View style={[styles.badge, { 
                                backgroundColor: customRequest.status === 'customer_accepted' ? '#DCFCE7' : 
                                                customRequest.status === 'quote_ready' ? '#FEF3C7' : 
                                                customRequest.status === 'completed' ? '#DBEAFE' : '#F3F4F6'
                              }]}>
                                <Text style={{ 
                                  color: customRequest.status === 'customer_accepted' ? '#16A34A' : 
                                         customRequest.status === 'quote_ready' ? '#D97706' : 
                                         customRequest.status === 'completed' ? '#2563EB' : '#6B7280',
                                  fontSize: 10, 
                                  fontWeight: '600' 
                                }}>
                                  {customRequest.status.replace('_', ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())}
                                </Text>
                              </View>
                              <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
                                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600' }}>
                                  {customRequest.priority}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>
                              {customRequest.items && customRequest.items.length > 0 ? 
                                customRequest.items.map(item => item.name).join(', ') : 
                                'Custom Request'
                              }
                              {customRequestQuantity > 1 && (
                                <Text style={{ color: colors.brand, fontWeight: "600" }}> (×{customRequestQuantity} orders)</Text>
                              )}
                            </Text>
                            <Text style={{ color: colors.sub, marginTop: 2, fontSize: 12 }}>
                              {customRequest.items?.length || 0} item(s){customRequestQuantity > 1 ? ` • ${customRequestQuantity} sets ordered` : ''}
                            </Text>
                          </View>
                          {customRequest.activeQuote && (
                            <Text style={{ color: colors.text, fontWeight: "800" }}>
                              ₦{((customRequest.activeQuote.grandTotalNaira || 0) * customRequestQuantity).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          )}
                        </View>
                        
                        {/* Custom Request Items */}
                        {customRequest.items && customRequest.items.length > 0 && (
                          <View style={{ width: '100%', paddingLeft: 54 }}>
                            {customRequest.items.map((item: CustomRequestItem, itemIdx: number) => (
                              <View key={`item-${itemIdx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                                    {item.name}
                                  </Text>
                                  <Text style={{ color: colors.sub, fontSize: 11 }}>
                                    {customRequestQuantity > 1 ? `${item.quantity * customRequestQuantity}` : item.quantity} {item.unit}{item.preferredBrand ? ` • ${item.preferredBrand}` : ''}
                                    {customRequestQuantity > 1 && (
                                      <Text style={{ color: colors.brand, fontSize: 10, fontWeight: '600' }}> ({item.quantity} × {customRequestQuantity})</Text>
                                    )}
                                  </Text>
                                </View>
                                {item.quotedPriceNaira && (
                                  <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: colors.sub, fontSize: 12 }}>
                                      ₦{(item.quotedPriceNaira * customRequestQuantity).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    {customRequestQuantity > 1 && (
                                      <Text style={{ color: colors.sub, fontSize: 10 }}>
                                        ₦{item.quotedPriceNaira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                                      </Text>
                                    )}
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      );
                    })}
                  </View>
                )}
                
                {/* Fallback for old custom_requests format */}
                {!order.customRequestDetails && order.custom_requests && order.custom_requests.length > 0 && (
                  <View>
                    {order.custom_requests.map((customRequest, idx) => (
                      <View key={`cr-${idx}`} style={styles.itemRow}>
                        <View style={[styles.itemIcon, { backgroundColor: "#FEF3C7" }]}>
                          <MaterialCommunityIcons name="clipboard-text" size={20} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "800" }}>
                            {customRequest.title}{customRequest.quantity > 1 ? ` (x${customRequest.quantity})` : ''}
                          </Text>
                          <Text style={{ color: colors.sub, marginTop: 2 }}>Custom Request • Quantity: {customRequest.quantity}</Text>
                        </View>
                        <Text style={{ color: colors.text, fontWeight: "800" }}>₦{(customRequest.price * customRequest.quantity).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* separator */}
                <View style={[styles.sep, { backgroundColor: colors.border }]} />

                {/* total and delivery info */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: colors.sub }}>Total Amount</Text>
                  <Text style={{ color: colors.text, fontWeight: "800" }}>₦{(() => {
                    const baseTotal = order.totalAmountNaira || 0;
                    
                    // Calculate custom requests total - use the detailed version if available, otherwise fallback
                    let customRequestsTotal = 0;
                    if (order.customRequestDetails && order.customRequestDetails.length > 0) {
                      customRequestsTotal = order.customRequestDetails.reduce((sum, cr) => {
                        const quantity = order.custom_requests?.find(crq => crq.custom_request_id === cr.id)?.quantity || 1;
                        return sum + ((cr.activeQuote?.grandTotalNaira || 0) * quantity);
                      }, 0);
                    } else if (order.custom_requests && order.custom_requests.length > 0) {
                      customRequestsTotal = order.custom_requests.reduce((sum, cr) => 
                        sum + (cr.price * cr.quantity), 0
                      );
                    }
                    
                    return (baseTotal + customRequestsTotal).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()}</Text>
                </View>
                
                {order.estimated_delivery && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: colors.sub }}>Estimated Delivery</Text>
                    <Text style={{ color: colors.text, fontWeight: "800" }}>{formatDate(order.estimated_delivery)}</Text>
                  </View>
                )}
                
                {order.delivery_address && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: colors.sub }}>Delivery Address</Text>
                    <Text style={{ color: colors.text, marginTop: 2 }}>
                      {order.delivery_address.street}, {order.delivery_address.city}
                    </Text>
                  </View>
                )}

                {/* actions */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  {actions.includes("track") && (
                    <Pressable style={[styles.orangeBtn, { backgroundColor: colors.brand }]}>
                      <Text style={{ color: "#fff", fontWeight: "800" }}>Track Order</Text>
                    </Pressable>
                  )}
                  {actions.includes("reorder") && (
                    <Pressable style={[styles.greyBtn, { backgroundColor: "#F3F4F6" }]}>
                      <Text style={{ color: colors.text, fontWeight: "800" }}>Reorder</Text>
                    </Pressable>
                  )}
                  {actions.includes("support") && (
                    <Pressable 
                      style={[styles.greyBtn, { backgroundColor: "#F3F4F6" }]}
                      onPress={() => router.push("/support/chat")}
                    >
                      <Text style={{ color: colors.text, fontWeight: "800" }}>Support</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    height: 60, 
    borderBottomWidth: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    justifyContent: "space-between" 
  },
  hBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  hTitle: { 
    fontWeight: "900", 
    fontSize: 20,
    textAlign: "center",
    flex: 1
  },

  // New tab styles to match the image
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 16,
  },

  // Existing styles
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  itemIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sep: { height: 1, marginVertical: 12, borderRadius: 1 },
  greyBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  orangeBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
