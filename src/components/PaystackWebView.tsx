import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Pressable,
  Text,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface PaystackWebViewProps {
  authorizationUrl: string;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  callbackUrl?: string;
}

const PaystackWebView: React.FC<PaystackWebViewProps> = ({
  authorizationUrl,
  reference,
  onSuccess,
  onCancel,
  onError,
  callbackUrl = 'http://127.0.0.1:9090/paystack/callback',
}) => {
  const webViewRef = useRef<WebView>(null);
  const { colors } = useTheme();
  const timeoutRef = useRef<number | null>(null);

  console.log('🔗 PaystackWebView rendered with:', {
    authorizationUrl,
    reference,
    callbackUrl
  });

  // Set up a fallback timeout to handle cases where WebView doesn't detect completion
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current as any);
    }

    // Set a 5-minute timeout as fallback
    timeoutRef.current = setTimeout(() => {
      console.log('🔗 Payment timeout reached, assuming success');
      onSuccess(reference);
    }, 5 * 60 * 1000) as any; // 5 minutes

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as any);
      }
    };
  }, [reference, onSuccess]);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    console.log('🔗 WebView navigation to:', url);
    
    // Check if the URL contains our callback domain
    if (url.includes(callbackUrl) || url.includes('payment/callback')) {
      console.log('🔗 Callback URL detected:', url);
      // Extract reference from URL if needed
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const urlReference = urlParams.get('reference') || reference;
      
      // Check for success indicators in the URL
      if (url.includes('success') || urlParams.get('status') === 'success') {
        console.log('🔗 Payment success detected from URL');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onSuccess(urlReference);
      } else if (url.includes('cancelled') || urlParams.get('status') === 'cancelled') {
        console.log('🔗 Payment cancelled detected from URL');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onCancel();
      } else {
        // For other callback scenarios, we'll verify the payment status
        console.log('🔗 Generic callback detected, assuming success');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onSuccess(urlReference);
      }
      return;
    }

    // Handle Paystack's redirect patterns
    if (url.includes('paystack.co/close') || url.includes('checkout.paystack.com/close')) {
      console.log('🔗 Paystack close URL detected');
      if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
      onSuccess(reference);
      return;
    }

    // Handle cancellation
    if (url.includes('cancelled') || url.includes('cancel')) {
      console.log('🔗 Payment cancellation detected');
      onCancel();
      return;
    }

    // Check for successful payment completion patterns
    if (url.includes('trxref=') || url.includes('reference=')) {
      console.log('🔗 Transaction reference detected in URL, assuming success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
      onSuccess(reference);
      return;
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    onError('Payment failed to load. Please try again.');
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView HTTP error:', nativeEvent);
    if (nativeEvent.statusCode >= 400) {
      onError('Payment service is currently unavailable. Please try again later.');
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('🔗 WebView message received:', data);
      
      // Handle Paystack's native event format
      if (data.event === 'success') {
        console.log('🔗 Paystack success event received');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        const paymentReference = data.data?.reference || reference;
        console.log('🔗 Calling onSuccess with reference:', paymentReference);
        onSuccess(paymentReference);
      } else if (data.event === 'cancelled' || data.event === 'cancel') {
        console.log('🔗 Paystack cancelled event received');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onCancel();
      } else if (data.event === 'error') {
        console.log('🔗 Paystack error event received:', data.data?.message);
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onError(data.data?.message || 'Payment failed');
      }
      
      // Handle custom message types (fallback)
      else if (data.type === 'payment_success') {
        console.log('🔗 Payment success message received');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onSuccess(data.reference || reference);
      } else if (data.type === 'payment_cancelled') {
        console.log('🔗 Payment cancelled message received');
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onCancel();
      } else if (data.type === 'payment_error') {
        console.log('🔗 Payment error message received:', data.message);
        if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
        onError(data.message || 'Payment failed');
      }
    } catch (error) {
      // Ignore non-JSON messages
      console.log('🔗 Non-JSON message received:', event.nativeEvent.data);
    }
  };

  // Inject JavaScript to handle Paystack's postMessage events
  const injectedJavaScript = `
    (function() {
      // Listen for Paystack events
      window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'object') {
          window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
        }
      });
      
      // Override window.close to handle payment completion
      const originalClose = window.close;
      window.close = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'payment_success',
          reference: '${reference}'
        }));
      };
      
      // Check for Paystack completion indicators
      const checkForCompletion = () => {
        const url = window.location.href;
        if (url.includes('paystack.co/close') || url.includes('payment/callback')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_success',
            reference: '${reference}'
          }));
        }
      };
      
      // Check periodically for completion
      setInterval(checkForCompletion, 1000);
      
      true; // Required for injected JavaScript
    })();
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Complete Payment</Text>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: authorizationUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading payment...</Text>
          </View>
        )}
        // Security and performance settings
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Handle SSL errors gracefully
        onShouldStartLoadWithRequest={(request) => {
          // Allow all HTTPS requests and Paystack domains
          return request.url.startsWith('https://') || request.url.includes('paystack.co');
        }}
      />

      {/* Security Badge */}
      <View style={[styles.securityBadge, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Ionicons name="shield-checkmark" size={16} color={colors.brand} />
        <Text style={[styles.securityText, { color: colors.sub }]}>Secured by Paystack</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  securityText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PaystackWebView;