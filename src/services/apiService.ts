import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
console.log('Environment variable EXPO_PUBLIC_USE_MOCK:', process.env.EXPO_PUBLIC_USE_MOCK);
console.log('USE_MOCK value:', USE_MOCK);

// Fix the environment variable by manually adding the colon if missing
let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9090';

if (apiUrl.includes('localhost9090')) {
  apiUrl = apiUrl.replace('localhost9090', 'localhost:9090');
}
// Add /api/v1 to the base URL for API endpoints
const API_BASE_URL = `${apiUrl}/api/v1`;
// Paystack endpoints use different base URL (no /api/v1 prefix)
const PAYSTACK_BASE_URL = `${apiUrl}`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone?: string;
}

interface LoginResponse {
  token: string;           // Changed from 'access_token'
  refreshToken: string;    // Changed from 'refresh_token'
  user: User;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  profit: number;
  stockQuantity: number;
  imageUrl: string;
  imagePublicId: string;
  category: string;
  tags: string[];
  lowStockThreshold: number;
  isLowStock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Address {
  id: string;
  user_id: number;
  label: string;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface CustomRequestItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  preferredBrand?: string;
  quotedPriceNaira?: number;
}

export interface CustomRequestQuote {
  id: string;
  itemsSubtotalNaira: number;
  grandTotalNaira: number;
  status: string;
}

export interface CustomRequestDetail {
  id: string;
  status: string;
  priority: string;
  items: CustomRequestItem[];
  activeQuote?: CustomRequestQuote;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  totalAmountNaira?: number;
  items: OrderItem[];
  custom_requests?: { custom_request_id: string; title: string; quantity: number; price: number; }[];
  customRequestDetails?: CustomRequestDetail[];
  delivery_address?: Address;
  delivery_mode?: 'home' | 'pickup';
  payment_method: string;
  created_at: string;
  createdAt?: string;
  estimated_delivery?: string;
}

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  maxUsage: number | null;
  usageCount: number;
  expiryDate: string | null;
  isActive: boolean;
  minimumOrderAmount: number;
}

interface CouponValidationResponse {
  valid: boolean;
  discountAmount: number;
  message: string;
  coupon?: Coupon;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: Product;
}

interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// Paystack payment interfaces
interface PaystackInitializeRequest {
  email: string;
  amount: number; // Amount in kobo (multiply by 100)
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
  paymentId?: string; // Added for UUID payment ID tracking
}

// New interfaces for UUID-based payment system
interface PaymentInitializeRequest {
  orderId: string; // Order UUID
  paymentMethod: string;
  returnUrl?: string;
  cancelUrl?: string;
}

interface PaymentInitializeResponse {
  paymentId: string; // UUID string
  transactionRef: string;
  paymentUrl: string;
  status: string;
}

interface PaymentStatusResponse {
  paymentId: string; // UUID string
  orderId: string; // UUID string
  status: string;
  amount: number;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
}

interface RefundRequest {
  paymentId: string; // UUID string
  amountKobo: number;
  reason: string;
}

interface RefundResponse {
  refundId: string; // UUID string
  paymentId: string; // UUID string
  amount: number;
  status: string;
  reason: string;
  createdAt: string;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: string; // Changed from number to string UUID
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    fees: number;
    customer: {
      id: string; // Changed from number to string UUID
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, any>;
      risk_action: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

interface DeliveryQuoteRequest {
  fromAddress: {
    street: string;
    city: string;
    state: string;
  };
  toAddress: {
    street: string;
    city: string;
    state: string;
  };
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface DeliveryQuote {
  id: string;
  estimated_cost: number;
  estimated_duration: string;
  provider: string;
}

interface DeliveryTracking {
  id: string;
  tracking_number: string;
  status: string;
  current_location: string;
  estimated_delivery: string;
  history: {
    status: string;
    location: string;
    timestamp: string;
    notes?: string;
  }[];
}

interface CustomRequest {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'under_review' | 'quote_sent' | 'customer_accepted' | 'approved' | 'customer_declined' | 'cancelled' | 'in_cart';
  quantity?: number;
  unit?: string;
  preferredBrand?: string;
  productImages?: string[];
  adminQuote?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerProfile {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  gender?: string;
  avatar?: string;
}

interface CreateAddressRequest {
  label: string;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

// Chat-related interfaces
interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  customRequestId?: string;
}

interface ChatRoom {
  id: string;
  userId: string;
  adminId?: string;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SendMessageRequest {
  chatRoomId: string;
  message: string;
  senderId: string;
  senderType: 'user' | 'admin';
  orderId?: string;
  customRequestId?: string;
}

interface CreateChatRoomRequest {
  customer_id: number;
  subject: string;
  message: string;
}

interface SaveFCMTokenRequest {
  fcmToken: string;
  deviceType: 'ios' | 'android';
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Request interceptor - Token added for:', config.url, 'Token length:', token.length);
        } else {
          console.warn('⚠️ Request interceptor - No token found for:', config.url);
          // Debug: Check all stored keys only for important requests
          if (config.url?.includes('/orders') || config.url?.includes('/auth')) {
            try {
              const allKeys = await AsyncStorage.getAllKeys();
              console.log('📱 AsyncStorage keys for', config.url, ':', allKeys);
              const tokenKeys = allKeys.filter(key => key.includes('token') || key.includes('Token'));
              console.log('🔑 Token-related keys:', tokenKeys);
              
              // Check if there are any values stored under different token keys
              for (const key of allKeys) {
                if (key.includes('token') || key.includes('Token') || key.includes('access') || key.includes('auth')) {
                  const value = await AsyncStorage.getItem(key);
                  console.log(`🔍 Key '${key}':`, value ? `${value.substring(0, 20)}...` : 'null');
                }
              }
            } catch (e) {
              console.error('Error checking AsyncStorage keys:', e);
            }
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅✅✅ RESPONSE INTERCEPTOR SUCCESS for:', response.config.url);
        return response;
      },
      async (error) => {
        console.log('🚨🚨🚨 RESPONSE INTERCEPTOR TRIGGERED - ERROR DETECTED!');
        console.log('🚨🚨🚨 Error URL:', error.config?.url);
        console.log('🚨🚨🚨 Error Status:', error.response?.status);
        console.log('🚨🚨🚨 Error Message:', error.message);
        
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄🔄🔄 RESPONSE INTERCEPTOR: 401 DETECTED - ATTEMPTING TOKEN REFRESH');
          originalRequest._retry = true;
          
          // Check what tokens we have before attempting refresh
          const currentAccessToken = await AsyncStorage.getItem('accessToken');
          const currentRefreshToken = await AsyncStorage.getItem('refreshToken');
          console.log('🔍🔍🔍 RESPONSE INTERCEPTOR: Current tokens before refresh:', {
            hasAccessToken: !!currentAccessToken,
            hasRefreshToken: !!currentRefreshToken,
            accessTokenLength: currentAccessToken?.length,
            refreshTokenLength: currentRefreshToken?.length
          });
          
          try {
            console.log('🔄🔄🔄 RESPONSE INTERCEPTOR: Starting token refresh process...');
            const refreshResult = await this.refreshToken();
            
            if (refreshResult.success) {
              console.log('✅✅✅ RESPONSE INTERCEPTOR: Token refresh successful, retrying original request');
              const token = await AsyncStorage.getItem('accessToken');
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            } else {
              console.log('❌❌❌ RESPONSE INTERCEPTOR: Token refresh failed:', refreshResult.message);
              throw new Error('Token refresh failed: ' + refreshResult.message);
            }
          } catch (refreshError) {
            console.log('❌❌❌ RESPONSE INTERCEPTOR: Token refresh error, about to clear tokens');
            console.error('🚪🚪🚪 RESPONSE INTERCEPTOR: Calling clearTokens due to refresh failure');
            console.log('🚪🚪🚪 CALLING clearTokens from RESPONSE INTERCEPTOR due to refresh failure');
            // Refresh failed, redirect to login
            await this.clearTokens();
            // You might want to emit an event here to redirect to login
            return Promise.reject(refreshError);
          }
        }
        
        console.log('🚨🚨🚨 RESPONSE INTERCEPTOR: Passing through error (not 401 or already retried)');
        return Promise.reject(error);
      }
    );
  }

  private async clearTokens() {
    console.log('🚪 ApiService - clearTokens called, removing tokens...');
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
    console.log('✅ ApiService - Tokens cleared successfully');
  }

  // Auth Methods
  async register(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<ApiResponse<any>> {
    try {
      // Transform the data to match backend API structure
      // Try different field combinations that the backend might expect
      const requestData = {
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        // Add potential missing fields that backend might require
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: 'customer' // Default role
      };
      
      console.log('📤 Registration request data:', JSON.stringify(requestData, null, 2));
      console.log('📍 Registration endpoint:', '/auth/register');
      
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/register', requestData);
      console.log('✅ Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: {
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          password: '[REDACTED]',
          phone: userData.phone
        }
      });
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || 'Registration failed',
      };
    }
  }

  async login(identifier: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      const loginData = isEmail 
        ? { email: identifier, password }
        : { phone: identifier, password };
      
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post('/auth/login', loginData);
  
      console.log('Backend response:', JSON.stringify(response.data, null, 2));
      console.log('Response status:', response.status);
      console.log('Response success field:', response.data.success);
      console.log('Response data field:', response.data.data);
  
      if (response.data.success && response.data.data) {
        // Use the correct field names from your backend
        const { token, refreshToken, user } = response.data.data;
        
        // Store tokens and user data
        await AsyncStorage.multiSet([
          ['accessToken', token],           // Map 'token' to 'accessToken'
          ['refreshToken', refreshToken],   // Use 'refreshToken' as is
          ['userData', JSON.stringify(user)],
        ]);
      }
  
      return response.data;
    } catch (error: any) {
      console.log('Login error caught:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }

  async verifyEmail(code: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/verify-email', {
        code,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Email verification failed',
      };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/forgot-password', {
        email,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset request failed',
      };
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/reset-password', {
        email,
        code,
        new_password: newPassword,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
      };
    }
  }

  async resendOTP(email: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/resend-otp', {
        email,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend OTP',
      };
    }
  }

  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('🔄 Attempting token refresh...');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('❌ No refresh token available in AsyncStorage');
        throw new Error('No refresh token available');
      }

      console.log('🔑 Refresh token found, making request to /auth/refresh-token');
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post('/auth/refresh-token', {
        refresh_token: refreshToken,
      });

      console.log('🔄 Refresh token response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        console.log('✅ Token refresh successful, storing new tokens');
        // Store new tokens
        await AsyncStorage.multiSet([
          ['accessToken', token],           // Changed from access_token
          ['refreshToken', newRefreshToken], // Changed from refresh_token
        ]);
      }

      return response.data;
    } catch (error: any) {
      console.log('❌ Token refresh failed:', error.message);
      console.log('🔍 Error details:', error.response?.data || error);
      console.log('🚪🚪🚪 CALLING clearTokens from refreshToken() method due to refresh failure');
      await this.clearTokens();
      return {
        success: false,
        message: error.response?.data?.message || 'Token refresh failed',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user profile',
      };
    }
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/logout');
      console.log('🚪🚪🚪 CALLING clearTokens from logout() method - successful logout');
      await this.clearTokens();
      return response.data;
    } catch (error: any) {
      // Clear tokens even if logout request fails
      console.log('🚪🚪🚪 CALLING clearTokens from logout() method - logout failed');
      await this.clearTokens();
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed',
      };
    }
  }

  // Product Methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<ProductsResponse>> {
    try {
      console.log('Fetching products from:', `${API_BASE_URL}/products`);
      const response: AxiosResponse<ApiResponse<ProductsResponse>> = await this.api.get('/products', {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          q: params?.search || '',
        },
      });
      console.log('Products response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Products fetch error:', error.message);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch products',
      };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response: AxiosResponse<ApiResponse<Product>> = await this.api.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch product',
      };
    }
  }

  // Add this new method
  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/categories');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories',
      };
    }
  }

  // Network connectivity test
  async testConnection(): Promise<ApiResponse<any>> {
    try {
      console.log('Testing connection to:', API_BASE_URL);
      const response = await axios.get(API_BASE_URL, { timeout: 5000 });
      console.log('Connection successful:', response.status);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.log('Connection failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend server is not running or not accessible');
      } else if (error.code === 'ENETUNREACH') {
        console.log('❌ Network unreachable');
      }
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Test registration endpoint to understand expected format
  async testRegistration(): Promise<void> {
    try {
      console.log('🧪 Testing registration endpoint...');
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123',
        phone: '+2341234567890',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer'
      };
      
      console.log('📤 Test registration data:', JSON.stringify(testData, null, 2));
      const response = await this.api.post('/auth/register', testData);
      console.log('✅ Test registration successful:', response.data);
    } catch (error: any) {
      console.error('❌ Test registration failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
  }

  // Health check
  async checkHealth(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/health');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Health check error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Health check failed'
      };
    }
  }

  // Profile API methods
  async getCustomerProfile(): Promise<ApiResponse<CustomerProfile>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/customers/profile');
      
      // Transform snake_case response to camelCase for frontend
      const profileData = response.data.data || response.data;
      const transformedProfile: CustomerProfile = {
        id: profileData.id,
        userId: profileData.user_id,
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        phone: profileData.phone || '',
        dateOfBirth: profileData.date_of_birth,
        gender: profileData.gender || '',
        avatar: profileData.avatar || '',
        status: profileData.status || 'active',
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at
      };
      
      return {
        success: true,
        data: transformedProfile,
        message: response.data.message || 'Profile fetched successfully'
      };
    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get profile'
      };
    }
  }

  async updateCustomerProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<CustomerProfile>> {
    try {
      console.log('ApiService: Starting profile update with data:', profileData);
      
      // Check if we have an auth token
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔑 Auth token status:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
      });
      
      if (!token) {
        console.log('❌ No authentication token found');
        return {
          success: false,
          message: 'Authentication required. Please log in again.'
        };
      }
      
      // Validate required fields
      if (!profileData.firstName?.trim() || !profileData.lastName?.trim()) {
        console.error('ApiService: Missing required fields');
        return {
          success: false,
          message: 'First name and last name are required'
        };
      }
      
      // Transform camelCase request to snake_case for backend
      const requestData: any = {
        first_name: profileData.firstName.trim(),
        last_name: profileData.lastName.trim(),
        phone: profileData.phone?.trim() || ''
      };
      
      // Only include gender if it's a valid non-empty value
      if (profileData.gender && profileData.gender.trim() !== '') {
        requestData.gender = profileData.gender.trim();
      }
      
      // Include avatar if it's provided
      if (profileData.avatar) {
        requestData.avatar = profileData.avatar;
      }
      
      console.log('ApiService: Sending request to backend with data:', requestData);
      const response: AxiosResponse<any> = await this.api.put('/customers/profile', requestData);
      console.log('ApiService: Received response:', response.data);
      
      // Transform snake_case response to camelCase for frontend
      const responseProfileData = response.data.data || response.data;
      const transformedProfile: CustomerProfile = {
        id: responseProfileData.id,
        userId: responseProfileData.user_id,
        firstName: responseProfileData.first_name || '',
        lastName: responseProfileData.last_name || '',
        phone: responseProfileData.phone || '',
        dateOfBirth: responseProfileData.date_of_birth,
        gender: responseProfileData.gender || '',
        avatar: responseProfileData.avatar || '',
        status: responseProfileData.status || 'active',
        createdAt: responseProfileData.created_at,
        updatedAt: responseProfileData.updated_at
      };
      
      console.log('ApiService: Profile update successful, transformed data:', transformedProfile);
      return {
        success: true,
        data: transformedProfile,
        message: response.data.message || 'Profile updated successfully'
      };
    } catch (error: any) {
      console.error('ApiService: Update profile error:', error);
      console.error('ApiService: Error response:', error.response?.data);
      console.error('ApiService: Error status:', error.response?.status);
      
      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data provided. Please check your input.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/auth/password/change', {
        currentPassword,
        newPassword
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  }

  // Address API methods
  async getCustomerAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/customers/addresses');
      
      // Handle backend response structure
      const responseData = response.data.data || response.data;
      const addresses = Array.isArray(responseData) ? responseData : [];
      
      return {
        success: true,
        data: addresses,
        message: response.data.message || 'Addresses fetched successfully'
      };
    } catch (error: any) {
      console.error('Get addresses error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get addresses'
      };
    }
  }

  async createCustomerAddress(addressData: CreateAddressRequest): Promise<ApiResponse<Address>> {
    try {
      const response: AxiosResponse<Address> = await this.api.post('/customers/addresses', addressData);
      return {
        success: true,
        data: response.data,
        message: 'Address created successfully'
      };
    } catch (error: any) {
      console.error('Create address error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create address'
      };
    }
  }

  async updateCustomerAddress(id: number, addressData: Partial<CreateAddressRequest>): Promise<ApiResponse<Address>> {
    try {
      const response: AxiosResponse<Address> = await this.api.put(`/customers/addresses/${id}`, addressData);
      return {
        success: true,
        data: response.data,
        message: 'Address updated successfully'
      };
    } catch (error: any) {
      console.error('Update address error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update address'
      };
    }
  }

  async setDefaultAddress(id: number): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(`/customers/addresses/${id}/default`);
      return {
        success: true,
        data: response.data,
        message: 'Default address set successfully'
      };
    } catch (error: any) {
      console.error('Set default address error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to set default address'
      };
    }
  }

  async deleteCustomerAddress(id: number): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/customers/addresses/${id}`);
      return {
        success: true,
        data: response.data,
        message: 'Address deleted successfully'
      };
    } catch (error: any) {
      console.error('Delete address error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete address'
      };
    }
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    try {
      console.log('🔍 Fetching orders from:', '/orders?page=1&limit=20');
      console.log('🔍 API Base URL:', this.api.defaults.baseURL);
      console.log('🔍 Auth Token:', this.api.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
      // Try with common query parameters that might be expected
      const response: AxiosResponse<any> = await this.api.get('/orders?page=1&limit=20');
      
      console.log('📦 Orders API response status:', response.status);
      console.log('📦 Orders API response data:', JSON.stringify(response.data, null, 2));
      
      // Handle backend response structure - orders are nested under data.data
      const responseData = response.data.data?.data || response.data.data || response.data;
      const orders = Array.isArray(responseData) ? responseData : [];
      
      console.log('📋 Response data structure:', {
        'response.data': !!response.data,
        'response.data.data': !!response.data.data,
        'response.data.data.data': !!response.data.data?.data,
        'final responseData': responseData,
        'is array': Array.isArray(responseData)
      });
      
      console.log('📋 Processed orders array:', orders);
      console.log('📋 Orders count:', orders.length);
      
      return {
        success: true,
        data: orders,
        message: response.data.message || 'Orders fetched successfully'
      };
    } catch (error: any) {
      console.error('❌ Get orders error:', error);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response headers:', error.response?.headers);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || 'Failed to get orders'
      };
    }
  }

  // Generate UUID for idempotency key
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async createOrder(orderData: {
    items: { product_id: string; quantity: number; price: number }[];
    custom_requests?: { custom_request_id: string; title: string; quantity: number; price: number; }[];
    delivery_address_id?: string;
    delivery_mode?: 'home' | 'pickup';
    payment_method: string;
    couponCode?: string;
  }): Promise<ApiResponse<Order>> {
    try {
      // Debug: Check token before making request
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔐 Create Order - Token exists:', !!token);
      
      // Generate idempotency key
      const idempotencyKey = this.generateUUID();
      console.log('🔑 Create Order - Idempotency key:', idempotencyKey);
      
      // Transform order data to match backend expectations
      const transformedOrderData = {
        ...orderData,
        IdempotencyKey: idempotencyKey, // Backend expects IdempotencyKey in request body
        ...(orderData.couponCode && { couponCode: orderData.couponCode }),
        items: orderData.items.map(item => ({
          ProductID: item.product_id, // Backend expects ProductID (capital case)
          quantity: item.quantity,
          price: item.price
        })),
        ...(orderData.custom_requests && {
          custom_requests: orderData.custom_requests.map(cr => ({
            CustomRequestID: cr.custom_request_id,
            title: cr.title,
            quantity: cr.quantity,
            price: cr.price
          }))
        })
      };
      
      console.log('📦 Create Order - Final transformed order data:', JSON.stringify(transformedOrderData, null, 2));
      
      const response: AxiosResponse<Order> = await this.api.post('/orders', transformedOrderData);
      return {
        success: true,
        data: response.data,
        message: 'Order created successfully'
      };
    } catch (error: any) {
      console.error('Create order error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create order'
      };
    }
  }

  // Cart Management Methods
  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/cart');
      const responseData = response.data.data || response.data;
      
      return {
        success: true,
        data: responseData,
        message: response.data.message || 'Cart fetched successfully'
      };
    } catch (error: any) {
      console.error('Get cart error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get cart'
      };
    }
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const response: AxiosResponse<CartItem> = await this.api.post('/cart/items', {
        productId,
        quantity
      });
      return {
        success: true,
        data: response.data,
        message: 'Item added to cart successfully'
      };
    } catch (error: any) {
      console.error('Add to cart error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add item to cart'
      };
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const response: AxiosResponse<CartItem> = await this.api.put(`/cart/items/${itemId}`, {
        quantity
      });
      return {
        success: true,
        data: response.data,
        message: 'Cart item updated successfully'
      };
    } catch (error: any) {
      console.error('Update cart item error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update cart item'
      };
    }
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/cart/items/${itemId}`);
      return {
        success: true,
        data: response.data,
        message: 'Item removed from cart successfully'
      };
    } catch (error: any) {
      console.error('Remove from cart error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove item from cart'
      };
    }
  }

  async clearCart(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete('/cart/clear');
      return {
        success: true,
        data: response.data,
        message: 'Cart cleared successfully'
      };
    } catch (error: any) {
      console.error('Clear cart error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to clear cart'
      };
    }
  }

  // Payment methods removed - using cash on delivery only

  // Delivery Tracking Methods
  async getDeliveryQuote(quoteData: DeliveryQuoteRequest): Promise<ApiResponse<DeliveryQuote>> {
    try {
      const response: AxiosResponse<DeliveryQuote> = await this.api.post('/delivery/quote', quoteData);
      return {
        success: true,
        data: response.data,
        message: 'Delivery quote fetched successfully'
      };
    } catch (error: any) {
      console.error('Get delivery quote error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get delivery quote'
      };
    }
  }

  async trackDelivery(deliveryId: string): Promise<ApiResponse<DeliveryTracking>> {
    try {
      const response: AxiosResponse<DeliveryTracking> = await this.api.get(`/delivery/${deliveryId}`);
      return {
        success: true,
        data: response.data,
        message: 'Delivery tracking fetched successfully'
      };
    } catch (error: any) {
      console.error('Track delivery error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to track delivery'
      };
    }
  }

  async trackDeliveryByOrder(orderId: string): Promise<ApiResponse<DeliveryTracking>> {
    try {
      const response: AxiosResponse<DeliveryTracking> = await this.api.get(`/delivery/order/${orderId}`);
      return {
        success: true,
        data: response.data,
        message: 'Order delivery tracking fetched successfully'
      };
    } catch (error: any) {
      console.error('Track delivery by order error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to track order delivery'
      };
    }
  }

  async trackDeliveryByNumber(trackingNumber: string): Promise<ApiResponse<DeliveryTracking>> {
    try {
      const response: AxiosResponse<DeliveryTracking> = await this.api.get(`/delivery/track/${trackingNumber}`);
      return {
        success: true,
        data: response.data,
        message: 'Delivery tracking by number fetched successfully'
      };
    } catch (error: any) {
      console.error('Track delivery by number error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to track delivery by number'
      };
    }
  }

  async getDeliveryHistory(deliveryId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/delivery/${deliveryId}/tracking`);
      return {
        success: true,
        data: response.data,
        message: 'Delivery history fetched successfully'
      };
    } catch (error: any) {
      console.error('Get delivery history error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get delivery history'
      };
    }
  }

  // Custom Request Methods
  async getCustomRequests(): Promise<ApiResponse<CustomRequest[]>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/custom-requests');
      const responseData = response.data.data || response.data;
      const requests = Array.isArray(responseData) ? responseData : [];
      
      return {
        success: true,
        data: requests,
        message: response.data.message || 'Custom requests fetched successfully'
      };
    } catch (error: any) {
      console.error('Get custom requests error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get custom requests'
      };
    }
  }

  async createCustomRequest(requestData: {
    title: string;
    description: string;
    quantity?: number;
    unit?: string;
    preferredBrand?: string;
    productImages?: string[];
  }): Promise<ApiResponse<CustomRequest>> {
    try {
      // Transform the request data to match backend's expected format
      const backendRequestData = {
        items: [
          {
            name: requestData.title,
            description: requestData.description,
            quantity: requestData.quantity || 1,
            unit: requestData.unit || 'piece',
            preferredBrand: requestData.preferredBrand,
            images: requestData.productImages || []
          }
        ],
        priority: 'MEDIUM',
        allowSubstitutions: true
      };
      
      const response: AxiosResponse<CustomRequest> = await this.api.post('/custom-requests', backendRequestData);
      return {
        success: true,
        data: response.data,
        message: 'Custom request created successfully'
      };
    } catch (error: any) {
      console.error('Create custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create custom request'
      };
    }
  }

  async getCustomRequest(requestId: string): Promise<ApiResponse<CustomRequest>> {
    try {
      const response: AxiosResponse<CustomRequest> = await this.api.get(`/custom-requests/${requestId}`);
      return {
        success: true,
        data: response.data,
        message: 'Custom request fetched successfully'
      };
    } catch (error: any) {
      console.error('Get custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get custom request'
      };
    }
  }

  async acceptCustomRequest(requestId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/custom-requests/${requestId}/accept`);
      return {
        success: true,
        data: response.data,
        message: 'Custom request accepted successfully'
      };
    } catch (error: any) {
      console.error('Accept custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to accept custom request'
      };
    }
  }

  async declineCustomRequest(requestId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/custom-requests/${requestId}/decline`);
      return {
        success: true,
        data: response.data,
        message: 'Custom request declined successfully'
      };
    } catch (error: any) {
      console.error('Decline custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to decline custom request'
      };
    }
  }

  // Admin method to send quote to customer
  async sendQuoteToCustomer(quoteId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(`/admin/custom-requests/quotes/${quoteId}/send`);
      return {
        success: true,
        data: response.data,
        message: 'Quote sent to customer successfully'
      };
    } catch (error: any) {
      console.error('Send quote to customer error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send quote to customer'
      };
    }
  }

  async updateCustomRequest(requestId: string, requestData: {
    title?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    preferredBrand?: string;
    productImages?: string[];
  }): Promise<ApiResponse<CustomRequest>> {
    try {
      const response: AxiosResponse<CustomRequest> = await this.api.put(`/custom-requests/${requestId}`, requestData);
      return {
        success: true,
        data: response.data,
        message: 'Custom request updated successfully'
      };
    } catch (error: any) {
      console.error('Update custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update custom request'
      };
    }
  }

  async deleteCustomRequest(requestId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/custom-requests/${requestId}/permanent-delete`);
      return {
        success: true,
        data: response.data,
        message: 'Custom request deleted successfully'
      };
    } catch (error: any) {
      console.error('Delete custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete custom request'
      };
    }
  }

  // Cancel custom request
  async cancelCustomRequest(requestId: string, reason: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/custom-requests/${requestId}/cancel`, {
        reason
      });
      return {
        success: true,
        data: response.data,
        message: 'Custom request cancelled successfully'
      };
    } catch (error: any) {
      console.error('Cancel custom request error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel custom request'
      };
    }
  }

  // Note: removeCustomRequestFromCart function removed - now using cancelCustomRequest for soft removal

  // Update custom request status
  async updateCustomRequestStatus(requestId: string, status: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(`/custom-requests/${requestId}/status`, {
        status
      });
      return {
        success: true,
        data: response.data,
        message: 'Custom request status updated successfully'
      };
    } catch (error: any) {
      console.error('Update custom request status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update custom request status'
      };
    }
  }

  async sendCustomRequestMessage(requestId: string, message: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/custom-requests/${requestId}/messages`, {
        message
      });
      return {
        success: true,
        data: response.data,
        message: 'Message sent successfully'
      };
    } catch (error: any) {
      console.error('Send custom request message error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  // Coupon Methods
  async getAvailableCoupons(): Promise<ApiResponse<Coupon[]>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/user/coupons/available');
      const responseData = response.data.data || response.data;
      const coupons = Array.isArray(responseData) ? responseData : [];
      
      return {
        success: true,
        data: coupons,
        message: response.data.message || 'Available coupons fetched successfully'
      };
    } catch (error: any) {
      console.error('Get available coupons error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get available coupons'
      };
    }
  }

  async validateCoupon(code: string, orderAmount: number): Promise<ApiResponse<CouponValidationResponse>> {
    try {
      console.log('🎫 Validating coupon:', code, 'for amount:', orderAmount);
      const response: AxiosResponse<any> = await this.api.post('/user/coupons/validate', {
        code,
        orderAmount: Math.round(orderAmount * 100) // Convert to kobo
      });
      
      console.log('🎫 Coupon validation response:', JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Coupon validated successfully'
      };
    } catch (error: any) {
      console.error('❌ Validate coupon error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || 'Failed to validate coupon'
      };
    }
  }

  async applyCoupon(code: string, orderId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/user/coupons/apply', {
        code,
        orderId
      });
      return {
        success: true,
        data: response.data,
        message: 'Coupon applied successfully'
      };
    } catch (error: any) {
      console.error('Apply coupon error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to apply coupon'
      };
    }
  }

  // Refund Credits Methods
  async getRefundCredits(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/user/refund-credits');
      return {
        success: true,
        data: response.data,
        message: 'Refund credits fetched successfully'
      };
    } catch (error: any) {
      console.error('Get refund credits error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get refund credits'
      };
    }
  }

  async convertRefundCredits(amount: number): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/user/refund-credits/convert', {
        amount
      });
      return {
        success: true,
        data: response.data,
        message: 'Refund credits converted successfully'
      };
    } catch (error: any) {
      console.error('Convert refund credits error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to convert refund credits'
      };
    }
  }

  // Chat-related methods
  async saveFCMToken(tokenData: SaveFCMTokenRequest): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/users/fcm-token', tokenData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save FCM token'
      };
    }
  }

  async getChatRooms(): Promise<ApiResponse<ChatRoom[]>> {
    try {
      const response: AxiosResponse<any> = await this.api.get('/chat/rooms');
      
      // Handle backend response structure
      if (response.data?.status === 'success') {
        return {
          success: true,
          data: response.data.data?.rooms || [],
          message: 'Chat rooms retrieved successfully'
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get chat rooms'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get chat rooms'
      };
    }
  }

  async createChatRoom(roomData: CreateChatRoomRequest): Promise<ApiResponse<ChatRoom>> {
    try {
      const response: AxiosResponse<ApiResponse<ChatRoom>> = await this.api.post('/chat/rooms', roomData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create chat room'
      };
    }
  }

  async getChatMessages(chatRoomId: string): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const response: AxiosResponse<ApiResponse<ChatMessage[]>> = await this.api.get(`/chat/rooms/${chatRoomId}/messages`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get chat messages'
      };
    }
  }

  async sendMessage(messageData: SendMessageRequest): Promise<ApiResponse<ChatMessage>> {
    try {
      const response: AxiosResponse<ApiResponse<ChatMessage>> = await this.api.post('/chat/messages', messageData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  async markMessagesAsRead(chatRoomId: string, messageIds: string[]): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.put('/chat/messages/read', {
        chatRoomId,
        messageIds
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark messages as read'
      };
    }
  }

  async sendNotificationToUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/admin/send-notification', {
        userId,
        title,
        body,
        data
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send notification'
      };
    }
  }

  // Paystack Payment Methods
  async initializePayment(paymentData: PaystackInitializeRequest): Promise<ApiResponse<PaystackInitializeResponse>> {
    try {
      // Use axios directly for Paystack endpoint (no JWT authentication required)
      const response: AxiosResponse<ApiResponse<PaystackInitializeResponse>> = await axios.post(
        `${API_BASE_URL}/payments/paystack/initialize`, 
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initialize payment'
      };
    }
  }

  async verifyPayment(reference: string): Promise<ApiResponse<PaystackVerifyResponse>> {
    try {
      // Use axios directly for Paystack endpoint (no JWT authentication required)
      const response: AxiosResponse<ApiResponse<PaystackVerifyResponse>> = await axios.get(
        `${API_BASE_URL}/payments/paystack/verify/${reference}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify payment'
      };
    }
  }

  // New UUID-based payment methods
  async initializePaymentWithUUID(paymentData: PaymentInitializeRequest): Promise<ApiResponse<PaymentInitializeResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<PaymentInitializeResponse>> = await this.api.post(
        '/payments/initialize',
        paymentData
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initialize payment'
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<ApiResponse<PaymentStatusResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<PaymentStatusResponse>> = await this.api.get(
        `/payments/${paymentId}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get payment status'
      };
    }
  }

  async processPayment(transactionRef: string, providerRef: string, status: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
        '/payments/process',
        {
          transactionRef,
          providerRef,
          status
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process payment'
      };
    }
  }

  async getPaymentRefunds(paymentId: string): Promise<ApiResponse<RefundResponse[]>> {
    try {
      const response: AxiosResponse<ApiResponse<RefundResponse[]>> = await this.api.get(
        `/payments/${paymentId}/refunds`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get payment refunds'
      };
    }
  }

  async requestRefund(refundData: RefundRequest): Promise<ApiResponse<RefundResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<RefundResponse>> = await this.api.post(
        '/payments/refunds',
        refundData
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to request refund'
      };
    }
  }

  // UUID validation helper
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Payment ID validation
  validatePaymentId(paymentId: string): boolean {
    if (!paymentId || typeof paymentId !== 'string' || paymentId.length !== 36) {
      return false;
    }
    return this.isValidUUID(paymentId);
  }
}

export const apiService = new ApiService();