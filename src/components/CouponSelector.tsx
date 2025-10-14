import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useCouponStore } from '../store/coupon.store';
import { useCartStore } from '../store/cart.store';

interface CouponSelectorProps {
  cartTotal: number;
  onCouponApplied: (discountAmount: number) => void;
  onCouponRemoved: () => void;
}

function money(v: number | string, ccy: "NGN" | "USD" = "NGN") {
  // Convert string to number if needed
  const numValue = typeof v === 'string' ? parseFloat(v) || 0 : v;
  return `${ccy === "USD" ? "$" : "₦"}${numValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CouponSelector({ cartTotal, onCouponApplied, onCouponRemoved }: CouponSelectorProps) {
  const { colors } = useTheme();
  const [couponCode, setCouponCode] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // Define success color since it's not in theme
  const successColor = '#10B981';
  
  // Cart store for syncing coupon state
  const { applyCoupon: applyCartCoupon, removeCoupon: removeCartCoupon } = useCartStore();
  
  const {
    availableCoupons,
    appliedCoupon,
    loading,
    error,
    validationLoading,
    fetchAvailableCoupons,
    validateCoupon,
    applyCoupon,
    removeCoupon,
    clearError,
    clearAppliedCoupon
  } = useCouponStore();

  useEffect(() => {
    if (showCouponModal && availableCoupons.length === 0) {
      fetchAvailableCoupons();
    }
  }, [showCouponModal]);

  // Clear applied coupon when cart is empty (cart was cleared)
  useEffect(() => {
    if (cartTotal === 0 && appliedCoupon) {
      clearAppliedCoupon();
      onCouponRemoved();
    }
  }, [cartTotal, appliedCoupon, clearAppliedCoupon, onCouponRemoved]);

  const handleApplyCoupon = async (code: string) => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await validateCoupon(code.trim().toUpperCase(), cartTotal);
      
      if (result.valid && result.coupon) {
        // Calculate discount based on coupon type
        let calculatedDiscount = 0;
        let savingsMessage = '';
        
        if (result.coupon.type === 'percentage') {
          // Calculate percentage discount
          calculatedDiscount = Math.round((cartTotal * result.coupon.value) / 100);
          savingsMessage = `Coupon applied! You saved ${money(calculatedDiscount)} (${result.coupon.value}% off). New total: ${money(cartTotal - calculatedDiscount)}`;
        } else if (result.coupon.type === 'fixed') {
          // Use fixed amount discount (convert from kobo to naira if needed)
          calculatedDiscount = result.coupon.value;
          savingsMessage = `Coupon applied! You saved ${money(calculatedDiscount)} (fixed discount). New total: ${money(cartTotal - calculatedDiscount)}`;
        }
        
        applyCoupon(result.coupon, calculatedDiscount);
        applyCartCoupon(result.coupon.code, calculatedDiscount);
        onCouponApplied(calculatedDiscount);
        setCouponCode('');
        setShowCouponModal(false);
        Alert.alert('Success', savingsMessage);
      } else {
        Alert.alert('Invalid Coupon', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    removeCartCoupon();
    onCouponRemoved();
    Alert.alert('Coupon Removed', 'The coupon has been removed from your order.');
  };

  const handleSelectAvailableCoupon = (coupon: any) => {
    setCouponCode(coupon.code);
    setShowCouponModal(false);
    handleApplyCoupon(coupon.code);
  };

  const renderCouponItem = ({ item }: { item: any }) => {
    const isEligible = cartTotal >= item.minimumOrderAmount;
    const discountText = item.type === 'percentage' 
      ? `${item.value}% OFF` 
      : `${money(item.value)} OFF`;
    
    return (
      <Pressable
        style={[
          styles.couponItem,
          { 
            backgroundColor: colors.card,
            borderColor: isEligible ? colors.brand : colors.border,
            opacity: isEligible ? 1 : 0.6
          }
        ]}
        onPress={() => isEligible && handleSelectAvailableCoupon(item)}
        disabled={!isEligible}
      >
        <View style={styles.couponLeft}>
          <View style={[styles.discountBadge, { backgroundColor: colors.brand }]}>
            <Text style={styles.discountText}>{discountText}</Text>
          </View>
          <View style={styles.couponInfo}>
            <Text style={[styles.couponCode, { color: colors.text }]}>{item.code}</Text>
            <Text style={[styles.couponDescription, { color: colors.sub }]}>{item.description}</Text>
            {item.minimumOrderAmount > 0 && (
              <Text style={[styles.minOrder, { color: colors.sub }]}>
                Min. order: {money(item.minimumOrderAmount)}
              </Text>
            )}
          </View>
        </View>
        {isEligible && (
          <Ionicons name="chevron-forward" size={20} color={colors.sub} />
        )}
        {!isEligible && (
          <Text style={[styles.notEligible, { color: colors.sub }]}>Not eligible</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View>
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <View style={[styles.appliedCoupon, { backgroundColor: successColor + '20', borderColor: successColor }]}>
          <View style={styles.appliedCouponLeft}>
            <Ionicons name="checkmark-circle" size={20} color={successColor} />
            <View style={styles.appliedCouponInfo}>
              <Text style={[styles.appliedCouponCode, { color: successColor }]}>
                {appliedCoupon.coupon.code}
              </Text>
              <Text style={[styles.appliedCouponSavings, { color: successColor }]}>
                You saved {money(appliedCoupon.discountAmount)}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleRemoveCoupon}>
            <Ionicons name="close-circle" size={20} color={colors.sub} />
          </Pressable>
        </View>
      )}

      {/* Coupon Input Section */}
      {!appliedCoupon && (
        <View style={[styles.couponSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.couponHeader}>
            <Text style={[styles.couponTitle, { color: colors.text }]}>Have a coupon?</Text>
            <Pressable onPress={() => setShowCouponModal(true)}>
              <Text style={[styles.viewCoupons, { color: colors.brand }]}>View available</Text>
            </Pressable>
          </View>
          
          <View style={styles.couponInputRow}>
            <TextInput
              style={[
                styles.couponInput,
                { 
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.sub}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <Pressable
              style={[
                styles.applyButton,
                { 
                  backgroundColor: colors.brand,
                  opacity: (couponCode.trim() && !validatingCoupon) ? 1 : 0.6
                }
              ]}
              onPress={() => handleApplyCoupon(couponCode)}
              disabled={!couponCode.trim() || validatingCoupon}
            >
              {validatingCoupon ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Available Coupons Modal */}
      <Modal
        visible={showCouponModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Available Coupons</Text>
            <Pressable onPress={() => setShowCouponModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={[styles.loadingText, { color: colors.sub }]}>Loading coupons...</Text>
            </View>
          ) : availableCoupons.length > 0 ? (
            <FlatList
              data={availableCoupons}
              keyExtractor={(item) => item.id}
              renderItem={renderCouponItem}
              contentContainerStyle={styles.couponsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noCouponsContainer}>
              <Ionicons name="ticket-outline" size={48} color={colors.sub} />
              <Text style={[styles.noCouponsText, { color: colors.sub }]}>No coupons available</Text>
              <Text style={[styles.noCouponsSubtext, { color: colors.sub }]}>Check back later for new offers!</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedCouponInfo: {
    gap: 2,
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  appliedCouponSavings: {
    fontSize: 12,
    fontWeight: '600',
  },
  couponSection: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewCoupons: {
    fontSize: 14,
    fontWeight: '600',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  applyButton: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  couponsList: {
    padding: 16,
  },
  couponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  couponInfo: {
    flex: 1,
    gap: 2,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  couponDescription: {
    fontSize: 14,
  },
  minOrder: {
    fontSize: 12,
  },
  notEligible: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noCouponsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noCouponsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  noCouponsSubtext: {
    fontSize: 14,
  },
});