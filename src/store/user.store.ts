import { create } from 'zustand';
import { apiService } from '../services/apiService';

interface Address {
  id: number;
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

interface UserStore {
  profile: CustomerProfile | null;
  addresses: Address[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { firstName: string; lastName: string; phone: string; gender?: string; avatar?: string }) => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (addressData: { label: string; type: string; street: string; city: string; state: string; country: string; postal_code: string; is_default: boolean }) => Promise<void>;
  updateAddress: (id: number, addressData: Partial<{ label: string; type: string; street: string; city: string; state: string; country: string; postal_code: string; is_default: boolean }>) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;
  clearError: () => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  addresses: [],
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    
    try {
      // Check authentication before making the request
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('accessToken');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      console.log('🔑 UserStore - Auth check:', {
        hasToken: !!token,
        isLoggedIn: isLoggedIn === '1'
      });
      
      // If user is not authenticated, don't make the API call
      if (!token || isLoggedIn !== '1') {
        console.log('❌ UserStore - User not authenticated, skipping profile fetch');
        set({ error: 'Please log in to view your profile', loading: false });
        return;
      }
      
      const response = await apiService.getCustomerProfile();
      
      if (response.success && response.data) {
        set({ profile: response.data, loading: false });
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      set({ error: error.message || 'Failed to fetch profile', loading: false });
    }
  },

  updateProfile: async (data) => {
    console.log('🔄 Starting profile update in store with data:', data);
    set({ loading: true, error: null });
    
    try {
      // Check authentication status
      const authStore = require('./auth.store').useAuthStore.getState();
      console.log('🔐 Auth status:', {
        isAuthenticated: authStore.isAuthenticated,
        hasUser: !!authStore.user,
        userId: authStore.user?.id
      });
      
      if (!authStore.isAuthenticated) {
        console.log('❌ User not authenticated');
        const errorMessage = 'Please log in to update your profile';
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
      
      console.log('📡 Calling API service updateCustomerProfile...');
      const response = await apiService.updateCustomerProfile(data);
      console.log('📥 API response received:', response);
      
      if (response.success && response.data) {
        console.log('✅ Profile update successful, updating store');
        set({ profile: response.data, loading: false });
      } else {
        console.log('❌ Profile update failed:', response.message);
        const errorMessage = response.message || 'Failed to update profile';
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.log('💥 Profile update error caught:', error);
      const errorMessage = error.message || 'Network error. Please try again.';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchAddresses: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.getCustomerAddresses();
      
      if (response.success && response.data) {
        const addresses: Address[] = response.data.map((addr) => ({
          id: Number(addr.id),
          user_id: addr.user_id,
          label: addr.label,
          type: addr.type,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          postal_code: addr.postal_code,
          is_default: addr.is_default,
          created_at: addr.created_at,
          updated_at: addr.updated_at,
        }));
        set({ addresses, loading: false });
      } else {
        throw new Error(response.message || 'Failed to fetch addresses');
      }
    } catch (error: any) {
      console.error('Fetch addresses error:', error);
      set({ error: error.message || 'Failed to fetch addresses', loading: false });
    }
  },

  addAddress: async (addressData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.createCustomerAddress(addressData);
      
      if (response.success && response.data) {
        const newAddress: Address = {
          id: Number(response.data.id),
          user_id: response.data.user_id,
          label: response.data.label,
          type: response.data.type,
          street: response.data.street,
          city: response.data.city,
          state: response.data.state,
          country: response.data.country,
          postal_code: response.data.postal_code,
          is_default: response.data.is_default,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at,
        };
        set(state => ({ 
          addresses: [...state.addresses, newAddress], 
          loading: false,
          error: null 
        }));
      } else {
        throw new Error(response.message || 'Failed to add address');
      }
    } catch (error: any) {
      console.error('Add address error:', error);
      set({ error: error.message || 'Failed to add address', loading: false });
    }
  },

  updateAddress: async (id, addressData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.updateCustomerAddress(id, addressData);
      
      if (response.success) {
        // Refresh addresses
        await get().fetchAddresses();
      } else {
        throw new Error(response.message || 'Failed to update address');
      }
    } catch (error: any) {
      console.error('Update address error:', error);
      set({ error: error.message || 'Failed to update address', loading: false });
    }
  },

  deleteAddress: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.deleteCustomerAddress(id);
      
      if (response.success) {
        // Refresh addresses
        await get().fetchAddresses();
      } else {
        throw new Error(response.message || 'Failed to delete address');
      }
    } catch (error: any) {
      console.error('Delete address error:', error);
      set({ error: error.message || 'Failed to delete address', loading: false });
    }
  },

  setDefaultAddress: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.setDefaultAddress(id);
      
      if (response.success) {
        // Refresh addresses
        await get().fetchAddresses();
      } else {
        throw new Error(response.message || 'Failed to set default address');
      }
    } catch (error: any) {
      console.error('Set default address error:', error);
      set({ error: error.message || 'Failed to set default address', loading: false });
    }
  },

  clearError: () => set({ error: null }),
  
  clearUser: () => set({ 
    profile: null, 
    addresses: [], 
    loading: false, 
    error: null 
  })
}));