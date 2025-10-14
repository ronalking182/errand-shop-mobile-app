import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { apiService } from '../services/apiService';
import PaystackWebView from './PaystackWebView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PaymentPopupProps {
  visible: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    amountNGN: number;
    currency: string;
    customer: {
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
    };
    meta?: any;
  };
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

type PaymentMethod = 'card' | 'bank_transfer' | 'ussd' | 'bank' | 'apple_pay';
type PaymentState = 'idle' | 'initializing' | 'processing' | 'success' | 'failure' | 'pending';

const PaymentPopup: React.FC<PaymentPopupProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  orderData,
  amount,
  email,
  firstName,
  lastName,
  phone,
}) => {  const { colors } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [authorizationUrl, setAuthorizationUrl] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [showWebView, setShowWebView] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  // Auto-trigger payment when popup opens
  useEffect(() => {
    console.log('🔗 useEffect triggered - visible:', visible, 'paymentState:', paymentState, 'authorizationUrl:', authorizationUrl);
    if (visible && (paymentState === 'idle' || (paymentState === 'processing' && !authorizationUrl))) {
      console.log('🔗 Auto-triggering payment initialization...');
      handlePayment();
    }
  }, [visible, paymentState, authorizationUrl]);

  // Auto-close modal after successful payment
  useEffect(() => {
    if (paymentState === 'success') {
      const timer = setTimeout(() => {
        console.log('🔗 Auto-closing payment modal after success');
        if (onSuccess && reference) {
          onSuccess(reference);
        }
        onClose();
      }, 3000); // Close after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [paymentState, onClose, onSuccess, reference]);

  // Reset state when popup closes
  useEffect(() => {
    if (!visible) {
      setPaymentState('idle');
      setAuthorizationUrl('');
      setReference('');
      setShowWebView(false);
      setErrorMessage('');
    }
  }, [visible]);

  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      name: 'Card Payment',
      icon: 'card-outline',
      note: 'Instant confirmation'
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Bank Transfer',
      icon: 'business-outline',
      note: 'May take a moment to reflect'
    },
    {
      id: 'ussd' as PaymentMethod,
      name: 'USSD',
      icon: 'phone-portrait-outline',
      note: 'Dial code on your phone'
    },
    {
      id: 'bank' as PaymentMethod,
      name: 'Pay with Bank',
      icon: 'home-outline',
      note: 'Direct bank payment'
    }
  ];

  // Calculate breakdown
  const subtotal = orderData.amountNGN * 0.95; // Assuming 5% delivery fee
  const deliveryFee = orderData.amountNGN * 0.05;
  const discount = 0;
  const total = orderData.amountNGN;

  const handlePayment = async () => {
    if (paymentState === 'processing' && authorizationUrl) return;
    
    console.log('🔗 Starting payment initialization...');
    setPaymentState('initializing');
    setErrorMessage('');
    
    try {
      // Initialize Paystack payment
      const paymentData = {
        email: orderData.customer.email,
        amount: orderData.amountNGN * 100, // Convert to kobo
        currency: orderData.currency || 'NGN',
        reference: `errand_${orderData.orderId}_${Date.now()}`,
        callback_url: process.env.CALLBACK_URL || 'http://127.0.0.1:9090/paystack/callback',
        metadata: {
          orderId: orderData.orderId,
          customer_name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
          customer_phone: orderData.customer.phone,
          ...orderData.meta
        },
        channels: selectedMethod === 'card' ? ['card'] : 
                 selectedMethod === 'bank_transfer' ? ['bank_transfer'] :
                 selectedMethod === 'ussd' ? ['ussd'] :
                 selectedMethod === 'bank' ? ['bank'] : ['card', 'bank_transfer', 'ussd', 'bank']
      };

      console.log('🔗 Payment data prepared:', paymentData);
      const response = await apiService.initializePayment(paymentData);
      console.log('🔗 API response received:', response);
      
      if (response.success && response.data) {
        console.log('🔗 Payment initialization successful:', response.data);
        
        // Access the nested data structure - the API returns data.data
        const paymentData = (response.data as any).data || response.data;
        const authUrl = paymentData.authorization_url;
        const paymentRef = paymentData.reference;
        
        console.log('🔗 Authorization URL:', authUrl);
        console.log('🔗 Reference:', paymentRef);
        
        setAuthorizationUrl(authUrl);
        setReference(paymentRef);
        setPaymentState('processing');
        
        console.log('🔗 Platform.OS detected as:', Platform.OS);
        
        // Handle web platform differently
        if (Platform.OS === 'web') {
          console.log('🔗 Opening payment in new window (web platform)');
          // Open payment URL in new window for web
          window.open(authUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
          
          // Show manual verification option for web
          Alert.alert(
            'Payment Window Opened',
            'Complete your payment in the new window, then return here to verify.',
            [
              {
                 text: 'I completed payment',
                 onPress: () => verifyPaymentStatus(paymentRef || '')
               },
              {
                text: 'Cancel',
                onPress: () => {
                  setPaymentState('idle');
                  setErrorMessage('Payment cancelled');
                },
                style: 'cancel'
              }
            ]
          );
        } else {
          // Use WebView for mobile platforms
          setShowWebView(true);
          console.log('🔗 WebView should show now');
        }
      } else {
        console.log('🔗 Payment initialization failed - invalid response:', response);
        setPaymentState('failure');
        setErrorMessage(response.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      console.log('🔗 Payment initialization error:', error);
      setErrorMessage(error.message || 'Failed to initialize payment');
      setPaymentState('failure');
    }
  };

  const handleWebViewSuccess = async (paymentReference: string) => {
    console.log('🔗 WebView success callback triggered with reference:', paymentReference);
    setShowWebView(false);
    setPaymentState('pending');
    
    // Verify payment with backend
    await verifyPaymentStatus(paymentReference);
  };

  const handleWebViewCancel = () => {
    setShowWebView(false);
    setPaymentState('idle');
    setErrorMessage('Payment was cancelled');
  };

  const handleWebViewError = (error: string) => {
    setShowWebView(false);
    setPaymentState('failure');
    setErrorMessage(error);
  };

  const verifyPaymentStatus = async (paymentReference?: string) => {
    const refToVerify = paymentReference || reference;
    console.log('🔗 Verifying payment status for reference:', refToVerify);
    
    if (!refToVerify) {
      console.log('🔗 No payment reference found');
      setPaymentState('failure');
      setErrorMessage('No payment reference found');
      return;
    }

    try {
      const response = await apiService.verifyPayment(refToVerify);
      console.log('🔗 Payment verification response:', response);
      
      if (response.success && response.data) {
        const paymentStatus = response.data.data.status;
        console.log('🔗 Payment status from API:', paymentStatus);
        
        if (paymentStatus === 'success') {
          console.log('🔗 Payment verified as successful');
          setPaymentState('success');
          // Don't call onSuccess immediately, let user interact with success screen
          // onSuccess will be called when user clicks Track Order or auto-close triggers
        } else if (paymentStatus === 'abandoned' || paymentStatus === 'failed') {
          console.log('🔗 Payment failed or abandoned');
          setPaymentState('failure');
          setErrorMessage('Payment verification failed');
        } else {
          console.log('🔗 Payment still pending, retrying...');
          setPaymentState('pending');
          // Retry verification after a delay
          if (verificationAttempts < 3) {
            setVerificationAttempts(prev => prev + 1);
            setTimeout(() => verifyPaymentStatus(refToVerify), 3000);
          } else {
            console.log('🔗 Max verification attempts reached, assuming success');
            setPaymentState('success');
          }
        }
      } else {
        console.log('🔗 Payment verification API failed:', response.message);
        setPaymentState('failure');
        setErrorMessage(response.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      console.log('🔗 Payment verification error:', error.message);
      setPaymentState('failure');
      setErrorMessage('Failed to verify payment');
    }
  };

  const handleManualVerify = () => {
    if (reference) {
      setPaymentState('pending');
      verifyPaymentStatus();
    }
  };

  const resetPayment = () => {
    setPaymentState('idle');
    setAuthorizationUrl('');
    setReference('');
    setErrorMessage('');
    setVerificationAttempts(0);
  };

  const renderPaymentMethods = () => (
    <View style={styles.methodsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
      {paymentMethods.map((method) => (
        <Pressable
          key={method.id}
          style={[
            styles.methodItem,
            {
              backgroundColor: selectedMethod === method.id ? colors.brand + '20' : colors.card,
              borderColor: selectedMethod === method.id ? colors.brand : colors.border
            }
          ]}
          onPress={() => setSelectedMethod(method.id)}
        >
          <View style={styles.methodLeft}>
            <Ionicons
              name={method.icon as any}
              size={24}
              color={selectedMethod === method.id ? colors.brand : colors.text}
            />
            <View style={styles.methodText}>
              <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
              <Text style={[styles.methodNote, { color: colors.sub }]}>{method.note}</Text>
            </View>
          </View>
          <View style={[
            styles.radioButton,
            {
              borderColor: selectedMethod === method.id ? colors.brand : colors.border,
              backgroundColor: selectedMethod === method.id ? colors.brand : 'transparent'
            }
          ]}>
            {selectedMethod === method.id && (
              <Ionicons name="checkmark" size={12} color="white" />
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderAmountBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <Pressable
        style={styles.breakdownHeader}
        onPress={() => setShowBreakdown(!showBreakdown)}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount Breakdown</Text>
        <Ionicons
          name={showBreakdown ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text}
        />
      </Pressable>
      
      {showBreakdown && (
        <View style={styles.breakdownDetails}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.sub }]}>Subtotal</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.sub }]}>Delivery Fee</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>₦{deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#22C55E' }]}>Discount</Text>
              <Text style={[styles.breakdownValue, { color: '#22C55E' }]}>-₦{discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
            </View>
          )}
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderPaymentState = () => {
    switch (paymentState) {
      case 'initializing':
        return (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[styles.stateText, { color: colors.text }]}>Initializing payment...</Text>
          </View>
        );
      
      case 'processing':
        // For web platform, don't show processing screen if we have authorization URL
        // The payment window should already be open
        if (Platform.OS === 'web' && authorizationUrl) {
          return (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={[styles.stateText, { color: colors.text }]}>Payment window opened</Text>
              <Text style={[styles.referenceText, { color: colors.sub }]}>Complete your payment in the new window</Text>
            </View>
          );
        }
        
        // For mobile platforms, hide main content when WebView should be shown
        if (showWebView && authorizationUrl) {
          return (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={[styles.stateText, { color: colors.text }]}>Loading payment...</Text>
            </View>
          );
        }
        
        // Default processing state
        return (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[styles.stateText, { color: colors.text }]}>Processing payment...</Text>
          </View>
        );
      
      case 'success':
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.successIcon, { backgroundColor: '#22C55E' }]}>
              <Ionicons name="checkmark" size={32} color="white" />
            </View>
            <Text style={[styles.stateTitle, { color: colors.text }]}>Payment Successful!</Text>
            <Text style={[styles.stateText, { color: colors.sub }]}>₦{orderData.amountNGN.toLocaleString('en-NG', { minimumFractionDigits: 2 })} paid</Text>
            <Text style={[styles.referenceText, { color: colors.sub }]}>Reference: {reference}</Text>
            
            <Text style={[styles.autoCloseText, { color: colors.sub }]}>This window will close automatically in a few seconds...</Text>
            
            <View style={styles.successActions}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.brand }]}
                onPress={() => {
                  if (onSuccess && reference) {
                    onSuccess(reference);
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="location-outline" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Track Order</Text>
                </View>
              </Pressable>
              
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => {
                  if (onClose) {
                    onClose();
                  }
                  // Navigate back to shopping
                  // TODO: Implement navigation to home/shop
                }}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="storefront-outline" size={20} color={colors.brand} />
                  <Text style={[styles.secondaryButtonText, { color: colors.brand }]}>Continue Shopping</Text>
                </View>
              </Pressable>
              
              <Pressable
                style={[styles.tertiaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  if (onClose) {
                    onClose();
                  }
                  // Navigate to orders list
                  // TODO: Implement navigation to orders
                }}
              >
                <Text style={[styles.tertiaryButtonText, { color: colors.sub }]}>View All Orders</Text>
              </Pressable>
            </View>
          </View>
        );
      
      case 'failure':
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.errorIcon, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="close" size={32} color="white" />
            </View>
            <Text style={[styles.stateTitle, { color: colors.text }]}>Payment Failed</Text>
            <Text style={[styles.stateText, { color: colors.sub }]}>{errorMessage}</Text>
            
            <View style={styles.failureActions}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.brand }]}
                onPress={resetPayment}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        );
      
      case 'pending':
        return (
          <View style={styles.stateContainer}>
            <View style={[styles.pendingIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="time" size={32} color="white" />
            </View>
            <Text style={[styles.stateTitle, { color: colors.text }]}>Payment Pending</Text>
            <Text style={[styles.stateText, { color: colors.sub }]}>We're confirming your payment. This may take a few moments.</Text>
            
            <View style={styles.pendingActions}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        );
      
      default:
        return (
          <ScrollView style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.merchantInfo}>
                <Text style={[styles.merchantName, { color: colors.text }]}>Errand Shop</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Text style={[styles.orderId, { color: colors.sub }]}>Order #{orderData.orderId}</Text>
                <Text style={[styles.totalAmount, { color: colors.text }]}>₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
            
            {/* Customer Info */}
            <View style={styles.customerContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
              <View style={styles.customerInfo}>
                <Text style={[styles.customerText, { color: colors.text }]}>{orderData.customer.firstName} {orderData.customer.lastName}</Text>
                <Text style={[styles.customerText, { color: colors.sub }]}>{orderData.customer.email}</Text>
                <Text style={[styles.customerText, { color: colors.sub }]}>{orderData.customer.phone}</Text>
              </View>
            </View>
            
            {renderPaymentMethods()}
            
            {selectedMethod === 'card' && (
              <View style={styles.cardOptions}>
                <View style={styles.saveCardOption}>
                  <Text style={[styles.saveCardText, { color: colors.text }]}>Save card for next time</Text>
                  <Switch
                    value={saveCard}
                    onValueChange={setSaveCard}
                    trackColor={{ false: colors.border, true: colors.brand }}
                    thumbColor={saveCard ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            )}
            
            {renderAmountBreakdown()}
          </ScrollView>
        );
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showWebView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Payment</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          {renderPaymentState()}
          
          {/* Debug Info */}
          {__DEV__ && (
            <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10 }}>
              <Text style={{ fontSize: 12, color: '#333' }}>Debug Info:</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Payment State: {paymentState}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Show WebView: {showWebView ? 'true' : 'false'}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Auth URL: {authorizationUrl ? 'Set' : 'Not set'}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Reference: {reference || 'Not set'}</Text>
            </View>
          )}
          
          {/* Actions */}
          {paymentState === 'idle' && (
            <View style={[styles.actionsContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.brand }]}
                onPress={handlePayment}
              >
                <Text style={styles.primaryButtonText}>Pay ₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          )}
          
          {/* Manual Payment Test Button */}
          {__DEV__ && paymentState === 'processing' && (
            <View style={[styles.actionsContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.brand }]}
                onPress={() => {
                  console.log('🔗 Manual WebView trigger');
                  console.log('🔗 Current showWebView:', showWebView);
                  console.log('🔗 Current authorizationUrl:', authorizationUrl);
                  if (authorizationUrl) {
                    setShowWebView(true);
                  }
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.brand }]}>Force Show WebView (Debug)</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
      
      {/* Paystack WebView */}
      {(() => {
        console.log('🔗 WebView render check - showWebView:', showWebView, 'authorizationUrl:', authorizationUrl);
        return showWebView && authorizationUrl && (
          <Modal
            visible={showWebView}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <PaystackWebView
              authorizationUrl={authorizationUrl}
              reference={reference}
              onSuccess={handleWebViewSuccess}
              onCancel={handleWebViewCancel}
              onError={handleWebViewError}
              callbackUrl="http://127.0.0.1:9090/paystack/callback"
            />
          </Modal>
        );
      })()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '700',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  customerContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  customerInfo: {
    gap: 4,
  },
  customerText: {
    fontSize: 14,
  },
  methodsContainer: {
    marginBottom: 24,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodText: {
    marginLeft: 12,
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
  },
  methodNote: {
    fontSize: 12,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOptions: {
    marginBottom: 24,
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  saveCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownDetails: {
    marginTop: 12,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  referenceText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successActions: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  failureActions: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  pendingActions: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tertiaryButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tertiaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  autoCloseText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default PaymentPopup;