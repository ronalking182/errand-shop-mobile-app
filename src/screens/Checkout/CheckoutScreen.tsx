import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useCartStore } from "../../store/cart.store";
import { useUserStore } from "../../store/user.store";
import { useOrdersStore } from "../../store/orders.store";
import { useAddresses } from "../../hooks/useAddresses";
import { useCouponStore } from "../../store/coupon.store";
import { Address, CreateAddressRequest } from "../../services/addressService";
import { useAuthStore } from "../../store/auth.store";
import { apiService } from "../../services/apiService";
import { v4 as uuidv4 } from 'uuid';
import { sanitizeUrl } from '../../utils/sanitizeUrl';
import PaymentPopup from '../../components/PaymentPopup';
import { deliveryService } from '../../services/deliveryService';

type Props = {
  navigation: any;
};

export default function CheckoutScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, totalPrice, clearCart, customRequests, customRequestsTotal } = useCartStore();
  const { profile } = useUserStore();
  const { createOrder, setOrderConfirmationData } = useOrdersStore();
  const { addresses, loading: addressLoading, createAddress } = useAddresses();
  const { appliedCoupon, removeCoupon } = useCouponStore();
  const { user } = useAuthStore();
  

  const [promoCode, setPromoCode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'home' | 'pickup'>('home');
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isLoadingDeliveryFee, setIsLoadingDeliveryFee] = useState(false);

  const [newAddressData, setNewAddressData] = useState({
    label: '',
    type: 'home',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    is_default: false
  });

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  // Reset address selection when switching delivery modes
  useEffect(() => {
    if (deliveryMode === 'home' && addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddress);
    } else if (deliveryMode === 'pickup') {
      // Clear selected address for pickup mode
      setSelectedAddress(null);
    }
  }, [deliveryMode, addresses]);

  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const subtotal = totalPrice + customRequestsTotal;
  const total = subtotal + deliveryFee - discount;

  // Calculate delivery fee when delivery mode or address changes
  useEffect(() => {
    const calculateDeliveryFee = async () => {
      if (deliveryMode === 'pickup') {
        setDeliveryFee(0);
        return;
      }

      if (deliveryMode === 'home' && selectedAddress) {
         setIsLoadingDeliveryFee(true);
         try {
           const estimate = await deliveryService.estimateDelivery(
             selectedAddress.id.toString(),
             user?.id
           );
           // Use the price from exact match or the first suggestion
           const deliveryCost = estimate.price || (estimate.suggestions && estimate.suggestions.length > 0 ? estimate.suggestions[0].price : 500);
           setDeliveryFee(deliveryCost);
        } catch (error) {
          console.error('Failed to get delivery estimate:', error);
          // Fallback to default fee if API fails
          setDeliveryFee(500);
        } finally {
          setIsLoadingDeliveryFee(false);
        }
      } else {
        // Default fee when no address is selected
        setDeliveryFee(500);
      }
    };

    calculateDeliveryFee();
  }, [deliveryMode, selectedAddress]);

  const handleAddAddress = async () => {
    try {
      const addressData: CreateAddressRequest = {
        label: newAddressData.label,
        type: newAddressData.type as 'home' | 'work' | 'other',
        street: newAddressData.street,
        city: newAddressData.city,
        state: newAddressData.state,
        country: newAddressData.country,
        postal_code: newAddressData.postal_code,
        is_default: newAddressData.is_default
      };
      
      const newAddress = await createAddress(addressData);
      
      // If this is the first address or it's set as default, select it
      if (addresses.length === 0 || newAddressData.is_default) {
        // The addresses will be updated by the hook, so we'll let the useEffect handle selection
      }
      
      setShowAddressForm(false);
      setNewAddressData({
        label: '',
        type: 'home',
        street: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postal_code: '',
        is_default: false
      });
      Alert.alert('Success', 'Address added successfully!');
    } catch (error) {
      console.error('Failed to add address:', error);
      Alert.alert('Error', 'Failed to add address. Please try again.');
    }
  };

  const updateAddressField = (field: keyof typeof newAddressData, value: any) => {
    setNewAddressData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmOrder = async () => {
    // Only require address for home delivery
    if (deliveryMode === 'home' && !selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (items.length === 0 && customRequests.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    // Show payment popup for Paystack payment
    setShowPaymentPopup(true);
  };

  const handlePaymentSuccess = async (reference: string) => {
    setShowPaymentPopup(false);
    setIsCreatingOrder(true);

    try {
      console.log('💳 Payment successful with reference:', reference);
      
      // Prepare order data for backend API
      const orderData = {
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity || 1,
          price: item.price
        })),
        custom_requests: customRequests
          .filter(cr => cr.status === 'customer_accepted' && (cr.cartPrice || 0) > 0)
          .map(cr => ({
            custom_request_id: cr.id,
            title: cr.title,
            quantity: cr.cartQuantity || 1,
            price: (cr.cartPrice || cr.adminQuote || 0)
          })),
        delivery_mode: deliveryMode,
        ...(deliveryMode === 'home' && selectedAddress ? { delivery_address_id: selectedAddress.id.toString() } : {}),
        payment_method: "paystack",
        payment_reference: reference,
        ...(appliedCoupon ? { couponCode: appliedCoupon.coupon.code } : {}),
        total: total
      };
      
      console.log('📦 Creating order in backend after payment:', JSON.stringify(orderData, null, 2));
      
      // Create order in backend database
      const createdOrder = await createOrder(orderData);
      
      if (createdOrder) {
        console.log('✅ Order successfully created in backend:', createdOrder.id);
        
        // Set order confirmation data in store
        const confirmationData = {
          orderNumber: createdOrder.orderNumber || createdOrder.order_number || createdOrder.id,
          total: total,
          items: items,
          customRequestDetails: customRequests,
          deliveryAddress: selectedAddress,
          deliveryMode: deliveryMode
        };
        setOrderConfirmationData(confirmationData);
        
        // Clear cart and coupon after successful order creation
        console.log('🧹 Clearing cart and coupon after successful order creation');
        clearCart();
        removeCoupon();
        
        // Navigate to order confirmation with the created order
        navigation.navigate('OrderConfirmation', {
          orderId: createdOrder.id,
          orderData: createdOrder,
          total: total,
          selectedAddress: selectedAddress,
          deliveryMode: deliveryMode,
          paymentReference: reference
        });
      } else {
        throw new Error('Failed to create order in backend');
      }
      
    } catch (error) {
      console.error('Create order error:', error);
      Alert.alert('Error', 'Failed to create order: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentPopup(false);
    Alert.alert('Payment Failed', error);
  };

  const handlePaymentClose = () => {
    setShowPaymentPopup(false);
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Delivery Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Mode</Text>
          
          <Pressable 
            style={[styles.deliveryOption, { 
              backgroundColor: colors.card, 
              borderColor: deliveryMode === 'home' ? "#22C55E" : colors.border 
            }]}
            onPress={() => setDeliveryMode('home')}
          >
            <View style={styles.deliveryIcon}>
              <Ionicons name="home" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deliveryTitle, { color: colors.text }]}>Home Delivery</Text>
              <Text style={[styles.deliverySubtitle, { color: colors.sub }]}>Delivered to your doorstep</Text>
              <Text style={[styles.deliveryTime, { color: colors.sub }]}>2-4 hours</Text>
            </View>
            <Text style={[styles.deliveryPrice, { color: colors.text }]}>
              {isLoadingDeliveryFee ? 'Calculating...' : 
                deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
            </Text>
            {deliveryMode === 'home' && (
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" style={{ marginLeft: 8 }} />
            )}
          </Pressable>

          <Pressable 
            style={[styles.deliveryOption, { 
              backgroundColor: colors.card, 
              borderColor: deliveryMode === 'pickup' ? "#22C55E" : colors.border 
            }]}
            onPress={() => setDeliveryMode('pickup')}
          >
            <View style={styles.deliveryIcon}>
              <Ionicons name="storefront" size={20} color={deliveryMode === 'pickup' ? "#22C55E" : colors.sub} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deliveryTitle, { color: deliveryMode === 'pickup' ? colors.text : colors.sub }]}>Store Pickup</Text>
              <Text style={[styles.deliverySubtitle, { color: colors.sub }]}>Shop 102, Ikeja Store WUYE</Text>
            </View>
            <Text style={[styles.deliveryPrice, { color: deliveryMode === 'pickup' ? colors.text : colors.sub }]}>Free</Text>
            {deliveryMode === 'pickup' && (
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" style={{ marginLeft: 8 }} />
            )}
          </Pressable>
        </View>

        {/* Delivery Address - Only show for home delivery */}
        {deliveryMode === 'home' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
            {(addresses.length > 0 || showAddressForm) && (
              <Pressable onPress={() => setShowAddressForm(!showAddressForm)}>
                <Text style={[styles.addNew, { color: "#EF4444" }]}>{showAddressForm ? 'Cancel' : 'Add New'}</Text>
              </Pressable>
            )}
          </View>

          {/* Inline Address Form */}
          {showAddressForm && (
            <View style={[styles.addressForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Label</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    value={newAddressData.label}
                    onChangeText={(value) => updateAddressField('label', value)}
                    placeholder="Home"
                    placeholderTextColor={colors.sub}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Type</Text>
                  <View style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, justifyContent: 'center' }]}>
                    <Text style={{ color: colors.text }}>{newAddressData.type.charAt(0).toUpperCase() + newAddressData.type.slice(1)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Street Address</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                  value={newAddressData.street}
                  onChangeText={(value) => updateAddressField('street', value)}
                  placeholder="123 Main Street"
                  placeholderTextColor={colors.sub}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>City</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    value={newAddressData.city}
                    onChangeText={(value) => updateAddressField('city', value)}
                    placeholder="Lagos"
                    placeholderTextColor={colors.sub}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>State</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    value={newAddressData.state}
                    onChangeText={(value) => updateAddressField('state', value)}
                    placeholder="Lagos"
                    placeholderTextColor={colors.sub}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Postal Code</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    value={newAddressData.postal_code}
                    onChangeText={(value) => updateAddressField('postal_code', value)}
                    placeholder="100001"
                    placeholderTextColor={colors.sub}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Country</Text>
                  <View style={[styles.formInput, { backgroundColor: colors.bg, borderColor: colors.border, justifyContent: 'center' }]}>
                    <Text style={{ color: colors.text }}>Nigeria</Text>
                  </View>
                </View>
              </View>

              <View style={styles.defaultOption}>
                <Switch
                  value={newAddressData.is_default}
                  onValueChange={(value) => updateAddressField('is_default', value)}
                  trackColor={{ false: colors.border, true: '#22C55E' }}
                  thumbColor={newAddressData.is_default ? '#fff' : colors.sub}
                />
                <Text style={[styles.defaultText, { color: colors.text }]}>Set as default address</Text>
              </View>

              <Pressable
                style={[styles.saveAddressBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleAddAddress}
              >
                <Text style={styles.saveAddressBtnText}>Save Address</Text>
              </Pressable>
            </View>
          )}

          {addressLoading ? (
            <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.loadingText, { color: colors.sub }]}>Loading addresses...</Text>
            </View>
          ) : addresses.length > 0 ? (
            <>
              {/* Show all addresses for selection */}
              {addresses.map((address) => (
                <Pressable
                  key={address.id}
                  style={[
                    styles.addressCard, 
                    { 
                      backgroundColor: colors.card, 
                      borderColor: selectedAddress?.id === address.id ? "#22C55E" : colors.border,
                      borderWidth: selectedAddress?.id === address.id ? 2 : 1,
                      marginBottom: 12
                    }
                  ]}
                  onPress={() => setSelectedAddress(address)}
                >
                  <View style={styles.addressHeader}>
                    <Text style={[styles.addressType, { color: colors.text }]}>{address.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.phoneNumber, { color: colors.sub }]}>{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</Text>
                      {selectedAddress?.id === address.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  </View>
                  
                  <Text style={[styles.streetAddress, { color: colors.text }]}>{address.street}</Text>
                  <Text style={[styles.addressDetails, { color: colors.sub }]}>{address.city}, {address.state} {address.postal_code}</Text>
                  <Text style={[styles.zipCode, { color: colors.sub }]}>{address.country}</Text>
                  
                  {address.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={[styles.defaultBadgeText, { color: "#22C55E" }]}>✓ Default Address</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </>
          ) : !showAddressForm ? (
            <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.noAddressText, { color: colors.sub }]}>No delivery address found</Text>
              <Pressable 
                style={[styles.addAddressBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => setShowAddressForm(true)}
              >
                <Text style={styles.addAddressBtnText}>Add New Address</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        )}



        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          
          {items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image source={{ uri: item.image || 'https://via.placeholder.com/40' }} style={styles.itemImage} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemQuantity, { color: colors.sub }]}>Qty: {item.quantity || 1}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>₦{(item.price * (item.quantity || 1)).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          ))}

          {/* Display Custom Requests */}
          {customRequests
            .filter(cr => cr.status === 'customer_accepted' && (cr.cartPrice || 0) > 0)
            .map((customRequest, index) => (
            <View key={`custom-${index}`} style={styles.orderItem}>
              <View style={[styles.itemImage, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 16 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>{customRequest.title}</Text>
                <Text style={[styles.itemQuantity, { color: colors.sub }]}>Qty: {customRequest.cartQuantity || 1}</Text>
                <Text style={[styles.itemQuantity, { color: '#EF4444', fontSize: 12 }]}>Custom Request</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>₦{(customRequest.cartPrice || customRequest.adminQuote || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          ))}

          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₦{typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>{deliveryMode === 'pickup' ? 'Pickup Fee' : 'Delivery Fee'}</Text>
            {isLoadingDeliveryFee ? (
              <Text style={[styles.summaryValue, { color: colors.sub }]}>Calculating...</Text>
            ) : (
              <Text style={[styles.summaryValue, { color: colors.text }]}>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</Text>
            )}
          </View>
          
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#22C55E" }]}>Discount (10%)</Text>
              <Text style={[styles.summaryValue, { color: "#22C55E" }]}>-₦{discount}</Text>
            </View>
          )}
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: "#EF4444" }]}>₦{typeof total === 'number' && !isNaN(total) ? total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.footer, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }]}>
        <Pressable 
          style={[styles.confirmButton, { backgroundColor: "#EF4444" }, (isCreatingOrder || isLoadingDeliveryFee) && styles.disabledButton]} 
          onPress={handleConfirmOrder}
          disabled={isCreatingOrder || isLoadingDeliveryFee}
        >
          <Text style={styles.confirmButtonText}>
            {isCreatingOrder ? 'Creating Order...' : isLoadingDeliveryFee ? 'Calculating Delivery...' : `Confirm Order • ₦${typeof total === 'number' && !isNaN(total) ? total.toLocaleString() : '0'}`}
          </Text>
        </Pressable>
      </View>

      {/* Payment Popup */}
      {showPaymentPopup && (
        <PaymentPopup
          visible={showPaymentPopup}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          orderData={{
             orderId: uuidv4(),
             amountNGN: total,
             currency: 'NGN',
             customer: {
               email: user?.email || 'customer@example.com',
               phone: profile?.phone || '+234',
               firstName: user?.first_name || 'Customer',
               lastName: user?.last_name || 'Name'
             },
             meta: {
               deliveryMode: deliveryMode,
               addressId: selectedAddress?.id,
               items: items.length,
               customRequests: customRequests.length
             }
           }}
          amount={total}
          email={user?.email || 'customer@example.com'}
          firstName={user?.first_name || 'Customer'}
          lastName={user?.last_name || 'Name'}
          phone={profile?.phone || '+234'}
        />
      )}

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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addNew: {
    fontSize: 14,
    fontWeight: "600",
  },
  deliveryOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  deliverySubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  deliveryTime: {
    fontSize: 12,
    marginTop: 2,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  addressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addressType: {
    fontSize: 16,
    fontWeight: "700",
  },
  phoneNumber: {
    fontSize: 14,
  },
  streetAddress: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  zipCode: {
    fontSize: 14,
    marginBottom: 12,
  },
  defaultOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  defaultText: {
    fontSize: 14,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
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
    fontWeight: "700",
  },
  paymentSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemQuantity: {
    fontSize: 14,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  summaryRow: {
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
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  defaultBadge: {
    marginTop: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noAddressText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  addAddressBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addAddressBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  addressForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveAddressBtn: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveAddressBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});