import { create } from 'zustand';
import { apiService } from '../services/apiService';
import { authService, UserData } from '../services/authService';

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;
        await authService.setLoggedIn(true, token, refreshToken, user);
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return true;
      } else {
        set({ 
          error: response.message || 'Login failed', 
          isLoading: false 
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: 'Network error. Please try again.', 
        isLoading: false 
      });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        set({ isLoading: false });
        return true;
      } else {
        set({ 
          error: response.message || 'Registration failed', 
          isLoading: false 
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: 'Network error. Please try again.', 
        isLoading: false 
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      });
    }
  },

  loadUser: async () => {
    console.log('🔄 Auth Store - loadUser called');
    const isLoggedIn = await authService.isLoggedIn();
    console.log('🔐 Auth Store - isLoggedIn check:', isLoggedIn);
    
    if (isLoggedIn) {
      const userData = await authService.getUserData();
      console.log('🔍 Auth Store - Loading user data:', userData);
      console.log('📧 Auth Store - User email:', userData?.email);
      console.log('🆔 Auth Store - User ID:', userData?.id);
      
      if (userData) {
        // Set user data immediately without making API calls that might fail
        // The email issue can be resolved during actual login flow
        set({ 
          user: userData, 
          isAuthenticated: true 
        });
        
        console.log('✅ Auth Store - User loaded successfully:', userData.id);
      } else {
        console.log('❌ Auth Store - No user data found in storage');
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      }
    } else {
      console.log('❌ Auth Store - User not logged in');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
    }
  },

  clearError: () => set({ error: null }),
}));