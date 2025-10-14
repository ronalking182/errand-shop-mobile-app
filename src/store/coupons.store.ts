import { create } from 'zustand';
import { apiService } from '../services/apiService';

// Use the Coupon interface from apiService
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

interface CouponsStore {
  availableCoupons: Coupon[];
  loading: boolean;
  error: string | null;
  
  fetchAvailableCoupons: () => Promise<void>;
  clearError: () => void;
  clearCoupons: () => void;
}

export const useCouponsStore = create<CouponsStore>((set, get) => ({
  availableCoupons: [],
  loading: false,
  error: null,

  fetchAvailableCoupons: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.getAvailableCoupons();
      
      if (response.success && response.data) {
        set({ 
          availableCoupons: response.data,
          loading: false 
        });
      } else {
        set({ 
          error: response.message || 'Failed to fetch coupons',
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: 'Network error',
        loading: false 
      });
    }
  },



  clearError: () => set({ error: null }),
  
  clearCoupons: () => set({ 
    availableCoupons: [],
    loading: false, 
    error: null 
  })
}));