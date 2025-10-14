import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chat.store';
import { useAuthStore } from '../../store/auth.store';
import { ChatMessage } from '../../services/messagingService';
import WebSocketService from '../../services/WebSocketService';

interface ChatScreenProps {
  chatRoomId?: string;
  orderId?: string;
  customRequestId?: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ 
  chatRoomId, 
  orderId, 
  customRequestId 
}) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const {
    currentChatRoom,
    messages,
    isLoading,
    typingUsers,
    isConnected,
    selectChatRoom,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket
  } = useChatStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    const initializeChat = async () => {
      if (chatRoomId) {
        await selectChatRoom(chatRoomId);
        // Connect WebSocket for this specific room
        connectWebSocket(chatRoomId);
      }
    };
    
    initializeChat();
    
    return () => {
      // Cleanup WebSocket connection when component unmounts
      disconnectWebSocket();
    };
  }, [chatRoomId]);

  useEffect(() => {
    // Scroll to newest message when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    if (chatRoomId && isConnected) {
      // Send typing start indicator
      WebSocketService.sendTypingIndicator(true, chatRoomId);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        WebSocketService.sendTypingIndicator(false, chatRoomId);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  // Note: Chat room creation should be handled by the backend when first message is sent

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatRoomId) return;
    
    const message = messageText.trim();
    setMessageText('');
    setIsTyping(true);
    
    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    
    // Stop typing indicator
    if (isConnected) {
      WebSocketService.sendTypingIndicator(false, chatRoomId);
    }
    
    try {
      if (isConnected) {
        // Send via WebSocket for real-time delivery
        WebSocketService.sendChatMessage(message, chatRoomId);
      } else {
        // Fallback to HTTP API
        const userId = user?.id || 'anonymous';
        await sendMessage(chatRoomId, message, userId);
      }
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(message);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUserMessage = item.senderType === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessage : styles.adminMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUserMessage ? styles.userBubble : styles.adminBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUserMessage ? styles.userMessageText : styles.adminMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isUserMessage ? styles.userMessageTime : styles.adminMessageTime
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        {isUserMessage && (
          <View style={styles.messageStatus}>
            <Ionicons 
              name={item.read ? 'checkmark-done' : 'checkmark'} 
              size={12} 
              color={item.read ? '#4CAF50' : '#999'} 
            />
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>Start a conversation</Text>
      <Text style={styles.emptyStateSubtext}>
        Send a message to get help from our support team
      </Text>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!typingUsers || typingUsers.length === 0) return null;
    
    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.length} people are typing...`;
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>{typingText}</Text>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    );
  };

  const renderConnectionStatus = () => {
    if (isConnected) return null;
    
    return (
      <View style={styles.connectionStatus}>
        <Ionicons name="cloud-offline-outline" size={16} color="#ff6b6b" />
        <Text style={styles.connectionStatusText}>Connecting...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Chat</Text>
        {orderId && (
          <Text style={styles.headerSubtitle}>Order #{orderId}</Text>
        )}
        {customRequestId && (
          <Text style={styles.headerSubtitle}>Custom Request</Text>
        )}
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={messages.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {renderTypingIndicator()}
        {renderConnectionStatus()}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || isTyping) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isTyping}
          >
            {isTyping ? (
              <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  adminMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#FF8C00',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  adminMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  adminMessageTime: {
    color: '#666',
  },
  messageStatus: {
    marginTop: 4,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  connectionStatusText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 4,
  },
});

export default ChatScreen;