import { useRouter } from 'expo-router';

export function useNavigationAdapter() {
  const router = useRouter();
  
  return {
    navigate: (route: string, params?: any) => {
      const routeMap: Record<string, string> = {
        'Login': '/login',
        'SignUp': '/signup',
        'Home': '/(tabs)/home',
        'VerifyEmail': '/verify-email',
        'AccountCreated': '/account-created',
        'Verified': '/verified',
        'ResetVerify': '/reset-verify',
        'SetNewPassword': '/set-new-password',
        'ForgotPasswordRequest': '/forgot',
        'Profile': '/(tabs)/profile',
        'Onboarding': '/onboarding',
        'AllProducts': '/(tabs)/home/all-products',
        'ProductDetails': '/product/details',
        'Cart': '/(tabs)/cart',
        'AddProducts': '/add-products',
        'SupportChat': '/support/chat',
        'Checkout': '/checkout',
        'OrderConfirmation': '/order-confirmation',
        'order-confirmation': '/order-confirmation',
        'Orders': '/(tabs)/orders',
        'MonnifyCheckoutWebView': '/monnify-checkout',
        'Notifications': '/notifications',
        'custom-request': '/custom-request',
        'CustomRequest': '/custom-request',
        'RequestDetails': '/request-details'
      };
      
      const path = routeMap[route] || `/${route.toLowerCase()}`;
      if (params) {
        // Convert complex objects to JSON strings for URL parameters
        const processedParams: any = {};
        Object.keys(params).forEach(key => {
          const value = params[key];
          if (typeof value === 'object' && value !== null) {
            processedParams[key] = JSON.stringify(value);
          } else {
            processedParams[key] = value;
          }
        });
        
        router.push({
          pathname: path as any,
          params: processedParams
        });
      } else {
        router.push(path as any);
      }
    },
    replace: (route: string) => {
      const routeMap: Record<string, string> = {
        'Home': '/(tabs)/home',
        'Login': '/login',
        'Onboarding': '/onboarding'
      };
      
      const path = routeMap[route] || `/${route.toLowerCase()}`;
      router.replace(path as any);
    },
    goBack: () => router.back()
  };
}