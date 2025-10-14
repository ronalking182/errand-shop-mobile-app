import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationService {
  registerForPushNotifications: () => Promise<string | null>;
  sendOrderStatusNotification: (orderNumber: string, status: string) => Promise<void>;
  sendDeliveryNotification: (orderNumber: string, message: string) => Promise<void>;
  sendChatNotification: (senderName: string, message: string, chatRoomId: string) => Promise<void>;
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  getNotificationPermissions: () => Promise<boolean>;
  requestNotificationPermissions: () => Promise<boolean>;
  clearChatNotifications: (chatRoomId: string) => Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  private pushToken: string | null = null;

  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        console.log('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = token.data;
      
      // Store token locally
      await AsyncStorage.setItem('pushToken', token.data);
      
      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async getNotificationPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  async requestNotificationPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async sendOrderStatusNotification(orderNumber: string, status: string): Promise<void> {
    const title = 'Order Status Update';
    let body = '';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        body = `Your order #${orderNumber} has been confirmed and is being prepared.`;
        break;
      case 'preparing':
        body = `Your order #${orderNumber} is being prepared.`;
        break;
      case 'in_transit':
      case 'in transit':
        body = `Your order #${orderNumber} is on its way to you!`;
        break;
      case 'delivered':
        body = `Your order #${orderNumber} has been delivered. Enjoy your groceries!`;
        break;
      case 'cancelled':
        body = `Your order #${orderNumber} has been cancelled.`;
        break;
      default:
        body = `Your order #${orderNumber} status has been updated to ${status}.`;
    }

    await this.scheduleLocalNotification(title, body, {
      type: 'order_status',
      orderNumber,
      status
    });
  }

  async sendDeliveryNotification(orderNumber: string, message: string): Promise<void> {
    const title = 'Delivery Update';
    const body = `Order #${orderNumber}: ${message}`;

    await this.scheduleLocalNotification(title, body, {
      type: 'delivery_update',
      orderNumber,
      message
    });
  }

  async sendChatNotification(senderName: string, message: string, chatRoomId: string): Promise<void> {
    const title = `${senderName}`;
    const body = message.length > 100 ? `${message.substring(0, 100)}...` : message;

    await this.scheduleLocalNotification(title, body, {
      type: 'chat_message',
      chatRoomId,
      senderName,
      message
    });
  }

  async clearChatNotifications(chatRoomId: string): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const chatNotifications = notifications.filter(
        notification => notification.content.data?.type === 'chat_message' &&
                      notification.content.data?.chatRoomId === chatRoomId
      );
      
      for (const notification of chatNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error clearing chat notifications:', error);
    }
  }

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Get stored push token
  async getStoredPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('pushToken');
    } catch (error) {
      console.error('Error getting stored push token:', error);
      return null;
    }
  }

  // Send push token to backend
  async sendPushTokenToBackend(token: string, userId: string): Promise<boolean> {
    try {
      // This would typically send the token to your backend
      // For now, we'll just log it
      console.log('Sending push token to backend:', { token, userId });
      
      // TODO: Implement actual API call to backend
      // const response = await apiService.registerPushToken(token, userId);
      // return response.success;
      
      return true;
    } catch (error) {
      console.error('Error sending push token to backend:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationServiceImpl();
export type { NotificationService };

// Notification event listeners
export const setupNotificationListeners = () => {
  // Handle notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification response (when user taps notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;
    
    if (data?.type === 'order_status' && data?.orderNumber) {
      // Navigate to orders screen or specific order
      console.log('Navigate to order:', data.orderNumber);
    } else if (data?.type === 'chat_message' && data?.chatRoomId) {
      // Navigate to chat screen
      console.log('Navigate to chat:', data.chatRoomId);
      // TODO: Implement navigation to chat screen
      // navigationService.navigate('Chat', { chatRoomId: data.chatRoomId });
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};