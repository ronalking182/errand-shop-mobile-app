import { create } from 'zustand';

// Lazy import messagingService to avoid Firebase initialization errors
let messagingService: any = null;
try {
  messagingService = require('../services/messagingService').messagingService;
} catch (error: any) {
  console.warn('MessagingService not available:', error?.message || 'Unknown error');
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'super admin';
  message: string;
  timestamp: Date;
  read: boolean;
  chatRoomId: string;
}

export interface ChatRoom {
  id: string;
  userId: string;
  messages: ChatMessage[];
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  orderId?: string;
  customRequestId?: string;
}

interface ChatStore {
  // State
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  realtimeUnsubscribers: (() => void)[];
  typingUsers: string[];
  isConnected: boolean;
  
  // Actions
  initializeChat: (userId: string) => Promise<void>;
  loadChatRooms: (userId: string) => Promise<void>;
  selectChatRoom: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, message: string, senderId: string) => Promise<void>;
  markMessagesAsRead: (roomId: string, messageIds: string[]) => Promise<void>;
  updateUnreadCount: (roomId: string, count: number) => void;
  setupRealtimeListeners: (userId: string, chatRoomId?: string) => void;
  cleanupListeners: () => void;
  clearError: () => void;
  addMessage: (message: ChatMessage) => void;
  setTypingUsers: (users: string[] | ((prev: string[]) => string[])) => void;
  setConnectionStatus: (connected: boolean) => void;
  connectWebSocket: (roomId?: string) => Promise<void>;
  disconnectWebSocket: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chatRooms: [],
  currentChatRoom: null,
  messages: [],
  isLoading: false,
  error: null,
  realtimeUnsubscribers: [],
  typingUsers: [],
  isConnected: false,

  // Initialize chat service
  initializeChat: async (userId: string) => {
    try {
      set({ isLoading: true });
      await messagingService.initializeMessaging();
      await get().loadChatRooms(userId);
      // Setup real-time listeners for chat rooms
      get().setupRealtimeListeners(userId);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Load all chat rooms for user
  loadChatRooms: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      if (!messagingService) {
        console.warn('MessagingService not available, skipping chat rooms loading');
        set({ isLoading: false });
        return;
      }
      const rooms = await messagingService.getChatRooms(userId);
      set({ 
        chatRooms: rooms.map((room: any) => ({
          ...room,
          messages: room.messages || [],
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt)
        })),
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      set({ error: 'Failed to load chat rooms', isLoading: false });
    }
  },

  // Select and load messages for a chat room
  selectChatRoom: async (roomId: string) => {
    const room = get().chatRooms.find(r => r.id === roomId);
    if (room) {
      set({ 
        currentChatRoom: room,
        isLoading: true
      });
      
      try {
        // Load messages from backend
        if (messagingService) {
          const messages = await messagingService.getChatMessages(roomId);
          const sortedMessages = (messages || []).sort((a: ChatMessage, b: ChatMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          set({ 
            messages: sortedMessages,
            isLoading: false
          });
        } else {
          const sortedMessages = (room.messages || []).sort((a: ChatMessage, b: ChatMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          set({ 
            messages: sortedMessages,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error loading chat messages:', error);
        set({ 
          messages: room.messages || [],
          error: 'Failed to load chat messages',
          isLoading: false
        });
      }
      
      // Setup real-time listener for this specific room
      get().setupRealtimeListeners(room.userId, roomId);
    }
  },

  // Send a message
  sendMessage: async (roomId: string, message: string, senderId: string) => {
    try {
      if (!messagingService) {
        console.warn('MessagingService not available, cannot send message');
        set({ error: 'Messaging service unavailable' });
        return;
      }
      await messagingService.sendMessage(roomId, message, senderId);
      // Message will be updated via real-time listener
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: 'Failed to send message' });
      throw error;
    }
  },



  // Mark messages as read
  markMessagesAsRead: async (roomId: string, messageIds: string[]) => {
    try {
      if (!messagingService) {
        console.warn('MessagingService not available, cannot mark messages as read');
        return;
      }
      await messagingService.markMessagesAsRead(roomId, messageIds);
      // Messages will be updated via real-time listener
    } catch (error) {
      console.error('Error marking messages as read:', error);
      set({ error: 'Failed to mark messages as read' });
      throw error;
    }
  },

  updateUnreadCount: (roomId: string, count: number) => {
    set(state => ({
      chatRooms: state.chatRooms.map(room => 
        room.id === roomId ? { ...room, unreadCount: count } : room
      )
    }));
  },

  setupRealtimeListeners: (userId: string, chatRoomId?: string) => {
    const { realtimeUnsubscribers } = get();
    
    if (!messagingService) {
      console.warn('MessagingService not available, skipping realtime listeners setup');
      return;
    }
    
    // Setup chat rooms listener
    const roomsUnsubscriber = messagingService.setupChatRoomsListener(userId, (rooms: any) => {
      set({ chatRooms: rooms });
    });
    
    let messagesUnsubscriber: (() => void) | null = null;
    
    // Setup messages listener if chatRoomId is provided
    if (chatRoomId) {
      messagesUnsubscriber = messagingService.setupRealtimeListeners(chatRoomId, (messages: any) => {
        set({ messages });
        
        // Update current chat room with latest message
        if (messages.length > 0) {
          const latestMessage = messages[0];
          set(state => ({
            currentChatRoom: state.currentChatRoom ? {
              ...state.currentChatRoom,
              messages,
              updatedAt: latestMessage.timestamp
            } : null
          }));
        }
      });
    }
    
    // Store unsubscribers
    const newUnsubscribers = [roomsUnsubscriber];
    if (messagesUnsubscriber) {
      newUnsubscribers.push(messagesUnsubscriber);
    }
    
    set({ realtimeUnsubscribers: [...realtimeUnsubscribers, ...newUnsubscribers] });
  },

  cleanupListeners: () => {
    const { realtimeUnsubscribers } = get();
    realtimeUnsubscribers.forEach(unsubscribe => unsubscribe());
    set({ realtimeUnsubscribers: [] });
  },

  clearError: () => set({ error: null }),

  // WebSocket integration methods
  addMessage: (message: ChatMessage) => {
    set(state => {
      // Update messages array
      const updatedMessages = [...state.messages, message];
      
      // Update current chat room if it exists
      const updatedCurrentChatRoom = state.currentChatRoom ? {
        ...state.currentChatRoom,
        messages: [...state.currentChatRoom.messages, message],
        updatedAt: message.timestamp
      } : null;
      
      // Check if chat room exists
      const existingRoomIndex = state.chatRooms.findIndex(room => 
        room.id === message.chatRoomId || (state.currentChatRoom && room.id === state.currentChatRoom.id)
      );
      
      let updatedChatRooms;
      
      if (existingRoomIndex !== -1) {
        // Update existing chat room
        console.log('💬 Updating existing chat room:', message.chatRoomId, 'with message from:', message.senderType);
        updatedChatRooms = state.chatRooms.map((room, index) => {
          if (index === existingRoomIndex) {
            const newUnreadCount = message.senderType !== 'user' ? room.unreadCount + 1 : room.unreadCount;
            console.log('📊 Room unread count:', room.unreadCount, '->', newUnreadCount);
            return {
              ...room,
              messages: [...room.messages, message],
              updatedAt: message.timestamp,
              unreadCount: newUnreadCount
            };
          }
          return room;
        });
      } else {
        // Create new chat room if it doesn't exist
        console.log('🆕 Creating new chat room:', message.chatRoomId, 'for message from:', message.senderType);
        const newChatRoom: ChatRoom = {
          id: message.chatRoomId,
          userId: message.senderId === 'current-user' ? message.senderId : 'current-user',
          messages: [message],
          unreadCount: message.senderType !== 'user' ? 1 : 0,
          createdAt: message.timestamp,
          updatedAt: message.timestamp
        };
        console.log('📊 New room unread count:', newChatRoom.unreadCount);
        updatedChatRooms = [...state.chatRooms, newChatRoom];
      }
      
      return {
        messages: updatedMessages,
        currentChatRoom: updatedCurrentChatRoom,
        chatRooms: updatedChatRooms
      };
    });
  },

  setTypingUsers: (users: string[] | ((prev: string[]) => string[])) => {
    set(state => ({
      typingUsers: typeof users === 'function' ? users(state.typingUsers) : users
    }));
  },

  setConnectionStatus: (connected: boolean) => {
    set({ isConnected: connected });
  },

  connectWebSocket: async (roomId?: string) => {
    try {
      const WebSocketService = (await import('../services/WebSocketService')).default;
      
      // Set up connection status handler
      WebSocketService.addMessageHandler('connection_change', (message: any) => {
        get().setConnectionStatus(message.connected || message.data?.connected || false);
      });
      
      await WebSocketService.connect(roomId);
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      set({ error: 'Failed to connect to chat service' });
    }
  },

  disconnectWebSocket: () => {
    import('../services/WebSocketService').then(({ default: WebSocketService }) => {
      WebSocketService.disconnect();
    });
    set({ isConnected: false });
  },
}));