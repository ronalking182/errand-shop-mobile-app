import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiService } from './apiService';

// Lazy imports for Firebase to handle missing native modules gracefully
let messaging: any = null;
let firestore: any = null;
let firebaseAvailable = false;

// Try to initialize Firebase modules
try {
  messaging = require('@react-native-firebase/messaging').default;
  firestore = require('@react-native-firebase/firestore').default;
  firebaseAvailable = true;
} catch (error: any) {
  console.warn('Firebase modules not available:', error?.message || 'Unknown error');
  firebaseAvailable = false;
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  customRequestId?: string;
}

export interface ChatRoom {
  id: string;
  userId: string;
  adminId?: string;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class MessagingService {
  private fcmToken: string | null = null;

  async initializeMessaging() {
    try {
      // Check if Firebase is available
      if (!firebaseAvailable || !messaging) {
        console.warn('Firebase messaging not available, skipping FCM initialization');
        return;
      }

      // Only initialize FCM on Android for now
      if (Platform.OS === 'android') {
         // Request permission
         const authStatus = await messaging().requestPermission();
         const enabled =
           authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;

         if (enabled) {
           console.log('Authorization status:', authStatus);
           
           // Get FCM token and register
           await this.ensureFcmTokenAndRegister();
         }

         // Listen for messages
         const unsubscribe = messaging().onMessage((remoteMessage: any) => {
           console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
           this.handleForegroundMessage(remoteMessage);
         });

         return unsubscribe;
      } else {
        console.log('iOS push notifications - skipping FCM registration for now');
        // iOS: skip FCM registration but still set up message handling
        return () => {}; // Return empty unsubscribe function
      }
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }

  async ensureFcmTokenAndRegister() {
     try {
       const token = await messaging().getToken();
       if (token) {
         console.log('FCM Token:', token);
         await this.saveFCMTokenToStorage(token);
         // Send token to backend
         await this.saveFCMToken(token);
       }
     } catch (error) {
       console.error('Error getting FCM token:', error);
     }
   }

  async saveFCMTokenToStorage(token: string) {
    try {
      await AsyncStorage.setItem('fcm_token', token);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  private handleForegroundMessage = (payload: any) => {
    // Handle incoming message when app is in foreground
    const { notification, data } = payload;
    
    // Note: Notification handling is now managed by WebSocketService to avoid duplicates
    // Just log the message for debugging purposes
    console.log('FCM message received (notification handled by WebSocketService):', JSON.stringify({
      title: notification?.title,
      body: notification?.body,
      data
    }));
  };

  private handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
  };

  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;
    
    // Navigate to chat screen based on notification data
    if (data?.chatRoomId) {
      // TODO: Navigate to chat screen
      // navigation.navigate('Chat', { chatRoomId: data.chatRoomId });
    }
  };

  async getFCMToken(): Promise<string | null> {
    if (!this.fcmToken) {
      try {
        this.fcmToken = await AsyncStorage.getItem('fcm_token');
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    }
    return this.fcmToken;
  }

  async sendMessage(chatRoomId: string, message: string, senderId: string, senderType: 'user' | 'admin' = 'user'): Promise<boolean> {
    try {
      const response = await apiService.sendMessage({
        chatRoomId,
        message,
        senderId,
        senderType
      });
      
      // Also save to Firestore for real-time updates
      await firestore().collection('messages').add({
        chatRoomId,
        senderId,
        senderType,
        message,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false
      });
      
      return response.success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const { apiService } = await import('./apiService');
      const response = await apiService.getChatRooms();
      
      if (response.success && response.data) {
        return response.data.map(room => ({
          ...room,
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt),
          messages: room.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          lastMessage: room.lastMessage ? {
            ...room.lastMessage,
            timestamp: new Date(room.lastMessage.timestamp)
          } : undefined
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      return [];
    }
  }

  async getChatMessages(chatRoomId: string): Promise<ChatMessage[]> {
    try {
      const { apiService } = await import('./apiService');
      const response = await apiService.getChatMessages(chatRoomId);
      
      if (response.success && response.data) {
        return response.data.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async markMessagesAsRead(chatRoomId: string, messageIds: string[]): Promise<boolean> {
    try {
      const { apiService } = await import('./apiService');
      const response = await apiService.markMessagesAsRead(chatRoomId, messageIds);
      
      // Update Firestore as well
      const batch = firestore().batch();
      messageIds.forEach(messageId => {
        const messageRef = firestore().collection('messages').doc(messageId);
        batch.update(messageRef, { read: true });
      });
      await batch.commit();
      
      return response.success;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Real-time listeners
  setupRealtimeListeners(chatRoomId: string, onMessagesUpdate: (messages: any[]) => void) {
    if (!firebaseAvailable || !firestore) {
      console.warn('Firebase not available, cannot setup realtime listeners');
      return () => {}; // Return empty unsubscribe function
    }
    return firestore()
      .collection('messages')
      .where('chatRoomId', '==', chatRoomId)
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot: any) => {
        const messages = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        onMessagesUpdate(messages);
      }, (error: any) => {
        console.error('Error in real-time listener:', error);
      });
  }

  setupChatRoomsListener(userId: string, onRoomsUpdate: (rooms: any[]) => void) {
    if (!firebaseAvailable || !firestore) {
      console.warn('Firebase not available, cannot setup chat rooms listener');
      return () => {}; // Return empty unsubscribe function
    }
    return firestore()
      .collection('chatRooms')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot((snapshot: any) => {
        const rooms = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        onRoomsUpdate(rooms);
      }, (error: any) => {
        console.error('Error in chat rooms listener:', error);
      });
  }

  async saveFCMToken(token: string): Promise<boolean> {
    try {
      const { apiService } = await import('./apiService');
      const deviceType = Platform.OS as 'ios' | 'android';
      const response = await apiService.saveFCMToken({
        fcmToken: token,
        deviceType
      });
      
      return response.success;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService;