import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';
import { useMessageStore } from '../hooks/useMessageStore';
import { notificationService } from './notificationService';
import { AppState } from 'react-native';

interface WebSocketMessage {
  type: string;
  data?: any;
  user_id?: string;
  timestamp?: number;
  [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private messageHandlers: Map<string, MessageHandler[]>;
  private isConnected: boolean;
  private currentRoomId: string | null;
  private appState: string;
  private processedMessageIds: Set<string>;
  private messageIdCleanupInterval: number | null;

  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.messageHandlers = new Map();
    this.isConnected = false;
    this.currentRoomId = null;
    this.appState = AppState.currentState;
    this.processedMessageIds = new Set();
    this.messageIdCleanupInterval = null;
    this.setupAppStateListener();
    this.startMessageIdCleanup();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;
    });
  }

  private startMessageIdCleanup() {
    // Clean up processed message IDs every 5 minutes to prevent memory leaks
    this.messageIdCleanupInterval = setInterval(() => {
      this.processedMessageIds.clear();
      console.log('🧹 Cleared processed message IDs cache');
    }, 5 * 60 * 1000);
  }

  async connect(roomId?: string | null): Promise<void> {
    try {
      // Prevent multiple connections
      if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
        console.log('WebSocket already connected or connecting, skipping new connection');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found, WebSocket connection skipped');
        return;
      }

      // Use environment variable for WebSocket URL, fallback to localhost
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:9090';
      const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      let fullWsUrl = `${wsUrl}/ws/chat?token=${encodeURIComponent(token)}`;
      if (roomId) {
        fullWsUrl += `&room_id=${encodeURIComponent(roomId)}`;
        this.currentRoomId = roomId;
      }

      console.log('🔌 Creating new WebSocket connection:', fullWsUrl);
      this.ws = new WebSocket(fullWsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.onConnectionChange(false);
        this.handleReconnect().catch(error => {
          console.error('Error during reconnection attempt:', error);
        });
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // If this is a connection error during initial connect, don't auto-reconnect
        if (!this.isConnected && this.reconnectAttempts === 0) {
          console.warn('Initial WebSocket connection failed. Backend server may not be running.');
        }
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  handleMessage(message: WebSocketMessage): void {
    console.log('📥 Received WebSocket message type:', message.type, 'from:', message.sender_type || message.data?.sender_type);
    
    // Notify registered handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));

    // Handle different message types
    switch (message.type) {
      case 'chat_message':
      case 'new_message':
        // Check for duplicate message processing
        const messageId = message.message_id || message.data?.message_id;
        if (messageId && this.processedMessageIds.has(messageId)) {
          console.log('🔄 Skipping duplicate message, ID:', messageId);
          return;
        }
        
        console.log('🔄 Processing', message.type + ', ID:', messageId || 'no-id');
        
        // Mark message as processed
        if (messageId) {
          this.processedMessageIds.add(messageId);
        }
        
        this.handleChatMessage(message);
        break;
      case 'typing_start':
      case 'typing_stop':
        this.handleTypingIndicator(message);
        break;
      case 'user_joined':
      case 'user_left':
        this.handleUserPresence(message);
        break;
    }
  }

  handleChatMessage(message: WebSocketMessage): void {
    // Update local chat state through the new message store
    const messageStore = useMessageStore.getState();
    const authStore = useAuthStore.getState();
    
    // Handle different message structures
    const messageData = message.data || message;
    let roomId = messageData.room_id || message.room_id || this.currentRoomId || 'unknown';
    
    // Normalize room ID - convert numeric room IDs to strings for consistency
    if (typeof roomId === 'number') {
      roomId = roomId.toString();
    }
    
    // If we have a currentRoomId and the message room ID is different but both are valid,
    // use the currentRoomId to ensure consistency within the chat session
    if (this.currentRoomId && roomId !== 'unknown' && roomId !== this.currentRoomId) {
      console.log('🔄 Room ID mismatch detected. Message room:', roomId, 'Current room:', this.currentRoomId, 'Using current room ID for consistency');
      roomId = this.currentRoomId;
    }
    
    const messageText = messageData.message || message.message || '';
    const messageTimestamp = new Date(messageData.timestamp || message.timestamp || Date.now());
    
    // Map sender_type to match the expected interface
    let senderType = messageData.sender_type || message.sender_type || 'customer';
    if (senderType === 'superadmin') {
      senderType = 'super admin';
    }
    
    // Determine read status: admin messages should be read for admin users
    const currentUserRole = authStore.user?.role;
    const isAdminMessage = senderType === 'admin' || senderType === 'super admin';
    const isCurrentUserAdmin = currentUserRole === 'admin' || currentUserRole === 'super admin' || currentUserRole === 'superadmin';
    const shouldMarkAsRead = isAdminMessage && isCurrentUserAdmin;
    
    const newMessage = {
       id: messageData.message_id || message.message_id || messageData.id || message.id || Date.now().toString(),
       message_id: messageData.message_id || message.message_id || messageData.id || message.id || Date.now().toString(),
       message: messageText,
       sender_id: messageData.sender_id || message.sender_id || 'unknown',
       sender_type: senderType as 'customer' | 'admin' | 'super admin',
       sender_name: messageData.sender_name || message.sender_name,
       room_id: roomId,
       timestamp: messageTimestamp.getTime(),
       read: shouldMarkAsRead,
       type: 'text' as const
     };
    
    console.log('📨 New message received:', {
      senderType: newMessage.sender_type,
      roomId: newMessage.room_id,
      currentUserRole,
      shouldMarkAsRead,
      message: newMessage.message.substring(0, 50) + '...'
    });
    
    // Add message to the new store (includes deduplication logic)
    messageStore.addMessage(newMessage);
    
    // Show notification if app is in background
    const shouldShowNotification = this.appState !== 'active';
    
    if (shouldShowNotification && (message.sender_type === 'admin' || message.sender_type === 'superadmin' || message.sender_type === 'super admin')) {
       const senderName = message.sender_name || 'Support';
       const messageText = message.message || '';
       
       if (messageText && roomId) {
         notificationService.sendChatNotification(senderName, messageText, roomId);
       }
     }
  }

  handleTypingIndicator(message: WebSocketMessage): void {
    // Show/hide typing indicator only for admin/super admin
    const { setTypingUsers } = useChatStore.getState();
    const senderType = message.sender_type || message.data?.sender_type;
    
    // Only show typing indicator for admin or super admin
    if (senderType === 'admin' || senderType === 'superadmin' || senderType === 'super admin') {
      if (message.type === 'typing_start' && message.user_id) {
        setTypingUsers(prev => [...prev, message.user_id!]);
      } else if (message.user_id) {
        setTypingUsers(prev => prev.filter(id => id !== message.user_id));
      }
    }
  }

  handleUserPresence(message: WebSocketMessage): void {
    // Update user presence status
    console.log('User presence update:', message);
  }

  sendMessage(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        timestamp: Date.now(),
        ...data
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  sendChatMessage(message: string, roomId: string): void {
    const { user } = useAuthStore.getState();
    const senderId = user?.id || user?.email || 'anonymous';
    
    this.sendMessage('chat_message', {
      message,
      room_id: roomId,
      sender_type: 'customer',
      sender_id: senderId
    });
  }

  sendTypingIndicator(isTyping: boolean, roomId: string): void {
    this.sendMessage(isTyping ? 'typing_start' : 'typing_stop', {
      room_id: roomId
    });
  }

  async handleReconnect(): Promise<void> {
    // Check if we have a token before attempting to reconnect
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token available, skipping reconnection');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Exponential backoff: increase delay with each attempt
      const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
      const maxDelay = 30000; // Cap at 30 seconds
      const actualDelay = Math.min(delay, maxDelay);
      
      console.log(`Waiting ${actualDelay}ms before reconnection attempt...`);
      setTimeout(() => {
        this.connect(this.currentRoomId);
      }, actualDelay);
    } else {
      console.error('Max reconnection attempts reached. Please check if the backend server is running.');
      console.warn('To retry connection, restart the app or navigate away and back to the chat screen.');
    }
  }

  onConnectionChange(connected: boolean): void {
    // Notify connection status change
    const handlers = this.messageHandlers.get('connection_change') || [];
    handlers.forEach(handler => handler({ type: 'connection_change', connected }));
  }

  addMessageHandler(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  removeMessageHandler(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.currentRoomId = null;
    }
    
    // Clear the cleanup interval
    if (this.messageIdCleanupInterval) {
      clearInterval(this.messageIdCleanupInterval);
      this.messageIdCleanupInterval = null;
    }
    
    // Clear processed message IDs
    this.processedMessageIds.clear();
  }

  /**
   * Reset reconnection attempts and try to connect again
   * Useful when user manually retries or navigates back to chat
   */
  retryConnection(roomId?: string | null): void {
    console.log('Manually retrying WebSocket connection...');
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect(roomId || this.currentRoomId);
  }

  getConnectionStatus(): { isConnected: boolean; readyState: number; currentRoomId: string | null } {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      currentRoomId: this.currentRoomId
    };
  }
}

export default new WebSocketService();