import { create } from 'zustand';

// Helper function to check if a message is from admin/support
const isAdminMessage = (senderType: string): boolean => {
  return senderType === 'admin' || senderType === 'super admin' || senderType === 'superadmin';
};

export interface ChatMessage {
  id: string;
  message_id?: string;
  message: string;
  sender_type: 'customer' | 'admin' | 'super admin' | 'superadmin';
  sender_id: string;
  sender_name?: string;
  room_id: string;
  timestamp: number;
  read?: boolean;
  type: 'text' | 'image' | 'file';
}

interface MessageStore {
  messagesByRoom: Record<string, ChatMessage[]>;
  unreadAdminCount: number;
  debugBadgeCount: () => void;
  testBadgeCountIssue: () => void;
  addMessage: (message: ChatMessage) => void;
  getMessages: (roomId: string) => ChatMessage[];
  getMessagesByRoom: (roomId: string) => ChatMessage[];
  clearMessages: (roomId: string) => void;
  markMessagesAsRead: (roomId: string) => void;
  getUnreadAdminCount: () => number;
  loadMessagesFromBackend: (roomId: string) => Promise<void>;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messagesByRoom: {},
  unreadAdminCount: 0,

  // Debug function to test badge count behavior
  debugBadgeCount: () => {
    const state = get();
    console.log('🐛 DEBUG: Current badge count:', state.unreadAdminCount);
    console.log('🐛 DEBUG: Messages by room:', Object.keys(state.messagesByRoom).map(roomId => {
      const messages = state.messagesByRoom[roomId];
      const unreadAdminMessages = messages.filter(m => isAdminMessage(m.sender_type) && !m.read);
      return `${roomId}: ${messages.length} total, ${unreadAdminMessages.length} unread admin`;
    }));
  },

  // Test function to simulate the badge count issue
  testBadgeCountIssue: () => {
    console.log('🧪 Testing badge count issue simulation...');
    const testRoomId = 'test-room-123';
    
    // Add some test admin messages
    const testMessages = [
      {
        id: 'msg1',
        message_id: 'msg1',
        message: 'Hello from admin',
        sender_type: 'admin' as const,
        sender_id: 'admin1',
        room_id: testRoomId,
        timestamp: Date.now() - 1000,
        read: false,
        type: 'text' as const
      },
      {
        id: 'msg2', 
        message_id: 'msg2',
        message: 'Another admin message',
        sender_type: 'admin' as const,
        sender_id: 'admin1',
        room_id: testRoomId,
        timestamp: Date.now(),
        read: false,
        type: 'text' as const
      }
    ];
    
    // Add messages one by one
    testMessages.forEach(msg => {
      get().addMessage(msg);
    });
    
    console.log('🧪 After adding messages:');
    get().debugBadgeCount();
    
    // Now mark messages as read
    console.log('🧪 Marking messages as read...');
    get().markMessagesAsRead(testRoomId);
    
    console.log('🧪 After marking as read:');
    get().debugBadgeCount();
  },

  addMessage: (message: ChatMessage) => {
    set((state) => {
      const roomId = message.room_id;
      const existingMessages = state.messagesByRoom[roomId] || [];
      
      // Check for duplicates using multiple criteria
      const messageId = message.message_id || message.id;
      const messageText = message.message;
      const timestamp = message.timestamp;
      const senderId = message.sender_id;
      
      // Also check for duplicates across all rooms (in case of room ID inconsistency)
      let isDuplicate = false;
      
      // First check within the same room
      isDuplicate = existingMessages.some((msg) => {
        // Check by message ID first
        if (messageId && (msg.message_id || msg.id) === messageId) {
          return true;
        }
        
        // Check by content, sender, and timestamp (within 5 seconds)
        if (msg.message === messageText && 
            msg.sender_id === senderId && 
            Math.abs(msg.timestamp - timestamp) < 5000) {
          return true;
        }
        
        return false;
      });
      
      // If not found in current room, check across all rooms for the same message ID
      if (!isDuplicate && messageId) {
        Object.values(state.messagesByRoom).forEach((roomMessages) => {
          if (roomMessages.some(msg => (msg.message_id || msg.id) === messageId)) {
            console.log('🔄 Duplicate message detected across rooms. Message ID:', messageId, 'Original room vs new room:', roomId);
            isDuplicate = true;
          }
        });
      }
      
      if (isDuplicate) {
        console.log('🔄 Duplicate message detected and skipped:', messageId || 'no-id', messageText.substring(0, 30) + '...');
        return state;
      }
      
      const updatedMessages = [...existingMessages, message];
      
      // Calculate unread admin count
      let unreadAdminCount = 0;
      Object.values({
        ...state.messagesByRoom,
        [roomId]: updatedMessages
      }).forEach((messages) => {
        messages.forEach((msg) => {
          if (isAdminMessage(msg.sender_type) && !msg.read) {
            unreadAdminCount++;
          }
        });
      });
      
      console.log('📊 Unread admin count updated:', unreadAdminCount, 'after adding message from:', message.sender_type, 'read status:', message.read, 'message ID:', messageId, 'room:', roomId);
      console.log('📊 Current messages by room:', Object.keys(state.messagesByRoom).map(room => `${room}: ${state.messagesByRoom[room].length} messages`));
      
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: updatedMessages
        },
        unreadAdminCount
      };
    });
  },

  getMessages: (roomId: string) => {
    return get().messagesByRoom[roomId] || [];
  },

  getMessagesByRoom: (roomId: string) => {
    return get().messagesByRoom[roomId] || [];
  },

  clearMessages: (roomId: string) => {
    set((state) => {
      const newMessagesByRoom = { ...state.messagesByRoom };
      delete newMessagesByRoom[roomId];
      
      // Recalculate unread admin count
      let unreadAdminCount = 0;
      Object.values(newMessagesByRoom).forEach((messages) => {
        messages.forEach((msg) => {
          if (isAdminMessage(msg.sender_type) && !msg.read) {
            unreadAdminCount++;
          }
        });
      });
      
      console.log('✅ Messages marked as read in room:', roomId, 'New unread count:', unreadAdminCount);
      
      return {
        messagesByRoom: newMessagesByRoom,
        unreadAdminCount
      };
    });
  },

  markMessagesAsRead: (roomId: string) => {
    set((state) => {
      console.log('🔄 markMessagesAsRead called for room:', roomId);
      console.log('🔍 Available rooms:', Object.keys(state.messagesByRoom));
      
      const messages = state.messagesByRoom[roomId];
      if (!messages) {
        console.log('❌ No messages found for room:', roomId);
        return state;
      }
      
      console.log('📋 Messages in room before marking as read:', messages.length);
      console.log('📋 Unread admin messages before:', messages.filter(m => isAdminMessage(m.sender_type) && !m.read).length);
      
      // Only mark admin messages as read (customers should only mark admin messages as read when viewing)
      const updatedMessages = messages.map((msg) => {
        if (isAdminMessage(msg.sender_type)) {
          return { ...msg, read: true };
        }
        return msg; // Keep customer messages unchanged
      });
      
      console.log('📋 Unread admin messages after:', updatedMessages.filter(m => isAdminMessage(m.sender_type) && !m.read).length);
      
      // Recalculate unread admin count using helper function
      let unreadAdminCount = 0;
      Object.values({
        ...state.messagesByRoom,
        [roomId]: updatedMessages
      }).forEach((messages) => {
        messages.forEach((msg) => {
          if (isAdminMessage(msg.sender_type) && !msg.read) {
            unreadAdminCount++;
          }
        });
      });
      
      console.log('📊 Unread admin count after marking admin messages as read:', unreadAdminCount, 'for room:', roomId);
      console.log('📊 Messages in room', roomId, ':', updatedMessages.length, 'Admin messages marked as read:', updatedMessages.filter(m => isAdminMessage(m.sender_type) && m.read).length);
      console.log('📊 Remaining unread admin messages across all rooms:', Object.values({...state.messagesByRoom, [roomId]: updatedMessages}).flat().filter(m => isAdminMessage(m.sender_type) && !m.read).length);
      
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: updatedMessages
        },
        unreadAdminCount
      };
    });
  },

  getUnreadAdminCount: () => {
    return get().unreadAdminCount;
  },

  loadMessagesFromBackend: async (roomId: string) => {
    try {
      const { apiService } = await import('../services/apiService');
      const response = await apiService.getChatMessages(roomId);
      
      if (response.success && response.data) {
        console.log('📥 Loading messages from backend for room:', roomId, 'Count:', response.data.length);
        
        // Map messages from backend
        const messages = response.data.map(msg => ({
          id: msg.id,
          message_id: msg.id,
          message: msg.message,
          sender_type: (msg.senderType === 'user' ? 'customer' : 'admin') as 'customer' | 'admin' | 'super admin' | 'superadmin',
          sender_id: msg.senderId,
          sender_name: undefined, // API doesn't provide sender name
          room_id: roomId,
          timestamp: new Date(msg.timestamp).getTime(),
          read: msg.read ?? false,
          type: 'text' as const
        }));
        
        // Sort messages by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Set messages in bulk and recalculate unread count only once
        set((state) => {
          const updatedMessagesByRoom = {
            ...state.messagesByRoom,
            [roomId]: messages
          };
          
          // Calculate unread admin count for all rooms
          let unreadAdminCount = 0;
          Object.values(updatedMessagesByRoom).forEach((roomMessages) => {
            roomMessages.forEach((msg) => {
              if (isAdminMessage(msg.sender_type) && !msg.read) {
                unreadAdminCount++;
              }
            });
          });
          
          console.log('📊 Bulk loaded messages - Unread admin count:', unreadAdminCount);
          
          return {
            messagesByRoom: updatedMessagesByRoom,
            unreadAdminCount
          };
        });
        
        console.log('✅ Successfully loaded', messages.length, 'messages from backend');
      } else {
        console.log('❌ Failed to load messages from backend:', response.message);
      }
    } catch (error) {
      console.error('❌ Error loading messages from backend:', error);
    }
  }
}));