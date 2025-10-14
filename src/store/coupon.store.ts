import { create } from 'zustand';
import { apiService } from '../services/apiService';

// Import types from API service
type Coupon = {
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
};

type CouponValidationResponse = {
  valid: boolean;
  discountAmount: number;
  message: string;
  coupon?: Coupon;
};

interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

interface CouponStore {
  availableCoupons: Coupon[];
  appliedCoupon: AppliedCoupon | null;
  loading: boolean;
  error: string | null;
  validationLoading: boolean;
  
  // Actions
  fetchAvailableCoupons: () => Promise<void>;
  validateCoupon: (code: string, orderAmount: number) => Promise<CouponValidationResponse>;
  applyCoupon: (coupon: Coupon, discountAmount: number) => void;
  removeCoupon: () => void;
  clearError: () => void;
  reset: () => void;
  clearAppliedCoupon: () => void;
}

export const useCouponStore = create<CouponStore>((set, get) => ({
  availableCoupons: [],
  appliedCoupon: null,
  loading: false,
  error: null,
  validationLoading: false,

  fetchAvailableCoupons: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiService.getAvailableCoupons();
      if (response.success && response.data) {
        set({ 
          availableCoupons: response.data,
          loading: false,
          error: null 
        });
      } else {
        set({ 
          error: response.message || 'Failed to fetch coupons',
          loading: false 
        });
      }
    } catch (error: any) {
      console.error('Fetch coupons error:', error);
      set({ 
        error: error.message || 'Network error occurred',
        loading: false 
      });
    }
  },

  validateCoupon: async (code: string, orderAmount: number): Promise<CouponValidationResponse> => {
    set({ validationLoading: true, error: null });
    try {
      const response = await apiService.validateCoupon(code, orderAmount);
      set({ validationLoading: false });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return {
          valid: false,
          discountAmount: 0,
          message: response.message || 'Invalid coupon code'
        };
      }
    } catch (error: any) {
      console.error('Validate coupon error:', error);
      set({ 
        error: error.message || 'Network error occurred',
        validationLoading: false 
      });
      return {
        valid: false,
        discountAmount: 0,
        message: 'Network error occurred'
      };
    }
  },

  applyCoupon: (coupon: Coupon, discountAmount: number) => {
    set({ 
      appliedCoupon: { coupon, discountAmount },
      error: null 
    });
  },

  removeCoupon: () => {
    set({ appliedCoupon: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      availableCoupons: [],
      appliedCoupon: null,
      loading: false,
      error: null,
      validationLoading: false
    });
  },

  // Clear applied coupon when cart is cleared
  clearAppliedCoupon: () => {
    set({ appliedCoupon: null });
  }
}));

export type { Coupon, CouponValidationResponse, AppliedCoupon };