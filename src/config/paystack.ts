// Paystack Configuration
// Note: In production, these should be stored as environment variables

export const PAYSTACK_CONFIG = {
  // Test Keys - loaded from environment variables
  TEST_PUBLIC_KEY: process.env.EXPO_PUBLIC_PAYSTACK_TEST_PUBLIC_KEY || '',
  TEST_SECRET_KEY: process.env.PAYSTACK_TEST_SECRET_KEY || '',
  
  // Live Keys (use in production) - loaded from environment variables
  LIVE_PUBLIC_KEY: process.env.EXPO_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY || '',
  LIVE_SECRET_KEY: process.env.PAYSTACK_LIVE_SECRET_KEY || '',
  
  // Environment flag
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Get current public key based on environment
  getPublicKey: () => {
    return PAYSTACK_CONFIG.IS_PRODUCTION 
      ? PAYSTACK_CONFIG.LIVE_PUBLIC_KEY 
      : PAYSTACK_CONFIG.TEST_PUBLIC_KEY;
  },
  
  // Get current secret key based on environment
  getSecretKey: () => {
    return PAYSTACK_CONFIG.IS_PRODUCTION 
      ? PAYSTACK_CONFIG.LIVE_SECRET_KEY 
      : PAYSTACK_CONFIG.TEST_SECRET_KEY;
  },
  
  // API Configuration
  BASE_URL: 'https://api.paystack.co',
  
  // Default callback URL (should be configured per app)
  DEFAULT_CALLBACK_URL: 'https://your-app.com/payment/callback',
  
  // Supported currencies
  SUPPORTED_CURRENCIES: ['NGN', 'USD', 'GHS', 'ZAR', 'KES'],
  
  // Supported payment channels
  SUPPORTED_CHANNELS: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
};

// Test cards for development (safe to include)
export const TEST_CARDS = {
  SUCCESS: {
    number: '4084084084084081',
    cvv: '408',
    expiry: '12/25',
    pin: '0000'
  },
  INSUFFICIENT_FUNDS: {
    number: '4084084084084081',
    cvv: '408', 
    expiry: '12/25',
    pin: '1111'
  },
  TIMEOUT: {
    number: '5060666666666666666',
    cvv: '123',
    expiry: '12/25'
  }
};

export default PAYSTACK_CONFIG;