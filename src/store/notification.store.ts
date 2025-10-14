import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notificationService';

interface NotificationPreferences {
  orderUpdates: boolean;
  deliveryNotifications: boolean;
  promotions: boolean;
  restockAlerts: boolean;
}

interface NotificationStore {
  // State
  isInitialized: boolean;
  hasPermission: boolean;
  pushToken: string | null;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;

  // Actions
  initializeNotifications: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendOrderStatusNotification: (orderNumber: string, status: string) => Promise<void>;
  sendDeliveryNotification: (orderNumber: string, message: string) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderUpdates: true,
  deliveryNotifications: true,
  promotions: false,
  restockAlerts: false,
};

const STORAGE_KEYS = {
  PREFERENCES: 'notification_preferences',
  PUSH_TOKEN: 'push_token',
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  isInitialized: false,
  hasPermission: false,
  pushToken: null,
  preferences: DEFAULT_PREFERENCES,
  loading: false,
  error: null,

  initializeNotifications: async () => {
    set({ loading: true, error: null });
    
    try {
      // Load saved preferences
      const savedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      const preferences = savedPreferences 
        ? { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPreferences) }
        : DEFAULT_PREFERENCES;

      // Check current permissions
      const hasPermission = await notificationService.getNotificationPermissions();
      
      // Get stored push token
      const storedToken = await notificationService.getStoredPushToken();
      
      // Register for push notifications if permissions granted
      let pushToken = storedToken;
      if (hasPermission && !storedToken) {
        pushToken = await notificationService.registerForPushNotifications();
      }

      set({
        isInitialized: true,
        hasPermission,
        pushToken,
        preferences,
        loading: false,
      });

      console.log('Notifications initialized:', {
        hasPermission,
        pushToken: pushToken ? 'Token received' : 'No token',
        preferences,
      });
    } catch (error: any) {
      console.error('Failed to initialize notifications:', error);
      set({
        error: 'Failed to initialize notifications',
        loading: false,
        isInitialized: true,
      });
    }
  },

  requestPermissions: async () => {
    set({ loading: true, error: null });
    
    try {
      const granted = await notificationService.requestNotificationPermissions();
      
      if (granted) {
        // Register for push notifications
        const pushToken = await notificationService.registerForPushNotifications();
        
        set({
          hasPermission: true,
          pushToken,
          loading: false,
        });
        
        return true;
      } else {
        set({
          hasPermission: false,
          loading: false,
          error: 'Notification permissions denied',
        });
        
        return false;
      }
    } catch (error: any) {
      console.error('Failed to request permissions:', error);
      set({
        error: 'Failed to request notification permissions',
        loading: false,
      });
      
      return false;
    }
  },

  updatePreferences: async (newPreferences: Partial<NotificationPreferences>) => {
    const { preferences } = get();
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(updatedPreferences)
      );
      
      set({ preferences: updatedPreferences });
      
      console.log('Notification preferences updated:', updatedPreferences);
    } catch (error: any) {
      console.error('Failed to update notification preferences:', error);
      set({ error: 'Failed to update preferences' });
    }
  },

  sendOrderStatusNotification: async (orderNumber: string, status: string) => {
    const { preferences, hasPermission } = get();
    
    if (!hasPermission || !preferences.orderUpdates) {
      console.log('Order notifications disabled or no permission');
      return;
    }
    
    try {
      await notificationService.sendOrderStatusNotification(orderNumber, status);
      console.log(`Order status notification sent: ${orderNumber} - ${status}`);
    } catch (error: any) {
      console.error('Failed to send order status notification:', error);
    }
  },

  sendDeliveryNotification: async (orderNumber: string, message: string) => {
    const { preferences, hasPermission } = get();
    
    if (!hasPermission || !preferences.deliveryNotifications) {
      console.log('Delivery notifications disabled or no permission');
      return;
    }
    
    try {
      await notificationService.sendDeliveryNotification(orderNumber, message);
      console.log(`Delivery notification sent: ${orderNumber} - ${message}`);
    } catch (error: any) {
      console.error('Failed to send delivery notification:', error);
    }
  },

  clearError: () => set({ error: null }),
}));