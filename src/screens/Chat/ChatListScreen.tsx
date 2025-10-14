import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chat.store';
import { ChatRoom } from '../../services/messagingService';
import WebSocketService from '../../services/WebSocketService';

interface ChatListScreenProps {
  onChatSelect: (chatRoomId: string) => void;
  onNewChat: () => void;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ 
  onChatSelect, 
  onNewChat 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    chatRooms,
    isLoading,
    isConnected,
    loadChatRooms,
    initializeChat,
    connectWebSocket,
    disconnectWebSocket,
  } = useChatStore();

  // Calculate total unread count from all chat rooms
  const unreadCount = chatRooms.reduce((total, room) => total + room.unreadCount, 0);

  useEffect(() => {
    handleInitializeChat();
    
    // Initialize WebSocket connection for general chat updates
    connectWebSocket();
    
    return () => {
      // Cleanup WebSocket connection when component unmounts
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  const handleInitializeChat = async () => {
    try {
      const userId = 'current_user_id'; // Replace with actual user ID from auth store
      await initializeChat(userId);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load chats');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const userId = 'current_user_id'; // Replace with actual user ID from auth store
      await loadChatRooms(userId);
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const hasUnread = item.unreadCount > 0;
    const lastMessage = item.lastMessage;
    
    return (
      <TouchableOpacity
        style={[styles.chatItem, hasUnread && styles.chatItemUnread]}
        onPress={() => onChatSelect(item.id)}
      >
        <View style={styles.chatAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatTitle, hasUnread && styles.chatTitleUnread]}>
              Support Chat
            </Text>
            {lastMessage && (
              <Text style={styles.chatTime}>
                {formatLastMessageTime(lastMessage.timestamp)}
              </Text>
            )}
          </View>
          
          <View style={styles.chatPreview}>
            <Text 
              style={[styles.chatLastMessage, hasUnread && styles.chatLastMessageUnread]}
              numberOfLines={1}
            >
              {lastMessage ? (
                `${lastMessage.senderType === 'admin' ? 'Support: ' : 'You: '}${lastMessage.message}`
              ) : (
                'No messages yet'
              )}
            </Text>
            
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateText}>
        Start a conversation with our support team
      </Text>
      <TouchableOpacity style={styles.newChatButton} onPress={onNewChat}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.newChatButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConnectionStatus = () => {
    if (isConnected) return null;
    
    return (
      <View style={styles.connectionStatus}>
        <Ionicons name="cloud-offline-outline" size={16} color="#ff6b6b" />
        <Text style={styles.connectionStatusText}>Connecting to chat...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {!isConnected && (
          <View style={styles.connectionIndicator}>
            <Ionicons name="cloud-offline-outline" size={16} color="#ff6b6b" />
          </View>
        )}
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.newChatIcon} onPress={onNewChat}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {renderConnectionStatus()}

      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={chatRooms.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  headerBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newChatIcon: {
    padding: 4,
  },
  chatList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatItemUnread: {
    backgroundColor: '#f8f9ff',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  chatTitleUnread: {
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  chatLastMessageUnread: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectionIndicator: {
    marginRight: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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

export default ChatListScreen;