import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { useMessageStore } from "../../hooks/useMessageStore";
import WebSocketService from "../../services/WebSocketService";
import { useAuthStore } from "../../store/auth.store";
import { apiService } from "../../services/apiService";

type Msg = { id: string; me?: boolean; text?: string; card?: boolean };

// Animated Typing Dots Component
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = animateDot(dot1, 0);
    const animation2 = animateDot(dot2, 200);
    const animation3 = animateDot(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  return (
    <View style={styles.typingDots}>
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot1,
            transform: [{
              scale: dot1.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot2,
            transform: [{
              scale: dot2.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot3,
            transform: [{
              scale: dot3.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            }],
          },
        ]}
      />
    </View>
  );
};

export default function SupportChatScreen() {
  const { colors } = useTheme();
  const { getMessages, markMessagesAsRead, loadMessagesFromBackend } = useMessageStore();
  const { user, loadUser } = useAuthStore();
  const [input, setInput] = useState("");
  const [localTypingTimeout, setLocalTypingTimeout] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supportRoomId, setSupportRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const listRef = useRef<FlatList<Msg>>(null);

  // Initialize support chat room
  useEffect(() => {
    const initializeSupportChat = async () => {
    console.log('🔄 SupportChatScreen - Loading user data...');
    await loadUser();
    
    // Get the updated user data from the store
    const currentUser = useAuthStore.getState().user;
    console.log('🔍 Current user from store:', currentUser);
    console.log('🔍 Current user ID:', currentUser?.id);
    
    if (!currentUser?.id) {
      console.log('❌ No user ID available, cannot initialize support chat');
      setIsLoadingRoom(false);
      return;
    }

    try {
      // First get the customer profile to get the numeric customer ID
      console.log('🔍 Getting customer profile for user:', currentUser.id);
      const profileResponse = await apiService.getCustomerProfile();
      
      if (!profileResponse.success || !profileResponse.data) {
        console.error('❌ Failed to get customer profile:', profileResponse.message);
        setIsLoadingRoom(false);
        return;
      }
      
      const customerProfile = profileResponse.data;
      console.log('📋 Customer profile:', customerProfile);
      console.log('🔢 Customer numeric ID:', customerProfile.id);
      
      console.log('🔍 Getting chat rooms for user:', currentUser.id);
      const response = await apiService.getChatRooms();
      
      if (response.success && response.data) {
        // Look for existing support chat room (first room for now, as we don't have order/request ID fields in the interface)
        const existingRoom = response.data[0]; // Take the first room as support room
        
        if (existingRoom) {
          console.log('✅ Found existing support chat room:', existingRoom.id);
          setSupportRoomId(existingRoom.id);
        } else {
          // Create new support chat room using the numeric customer ID
           console.log('🆕 Creating new support chat room for customer ID:', customerProfile.id);
           const roomData = { 
             customer_id: customerProfile.id,
             subject: 'Support Chat',
             message: 'Hello, I need support with my order or account.'
           };
          console.log('📤 Sending room data:', roomData);
          const createResponse = await apiService.createChatRoom(roomData);
          
          if (createResponse.success && createResponse.data) {
            console.log('✅ Created new support chat room:', createResponse.data.id);
            setSupportRoomId(createResponse.data.id);
          } else {
            console.error('❌ Failed to create support chat room:', createResponse.message);
          }
        }
        } else {
          console.error('❌ Failed to get chat rooms:', response.message);
        }
      } catch (error) {
        console.error('❌ Error initializing support chat:', error);
      } finally {
        setIsLoadingRoom(false);
      }
    };

    initializeSupportChat();
  }, [user?.id]);

  // Connect to WebSocket and load messages when room is ready
  useEffect(() => {
    if (!supportRoomId) return;

    // Connect to support chat room with retry capability
    WebSocketService.retryConnection(supportRoomId);
    
    // Monitor connection status
    const checkConnection = () => {
      const status = WebSocketService.getConnectionStatus();
      setIsConnected(status.isConnected);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    
    // Load existing messages from backend and mark admin messages as read since user is viewing the chat
    const initializeChat = async () => {
      console.log('💬 SupportChatScreen mounted - loading messages from backend for room:', supportRoomId);
      await loadMessagesFromBackend(supportRoomId);
      console.log('💬 Messages loaded, now marking admin messages as read since user is viewing chat for room:', supportRoomId);
      // Add a small delay to ensure messages are loaded before marking as read
      setTimeout(() => {
        markMessagesAsRead(supportRoomId);
      }, 100);
    };
    
    initializeChat();
    
    return () => {
      clearInterval(interval);
      // Don't disconnect WebSocket as it's a singleton service that might be used elsewhere
      console.log('💬 SupportChatScreen unmounting - keeping WebSocket connection alive');
    };
  }, [supportRoomId]);

  // Get messages for this room
  const messages = supportRoomId ? getMessages(supportRoomId) : [];

  // Mark new messages as read when they arrive while chat is active
  useEffect(() => {
    if (supportRoomId && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (!latestMessage.read && (latestMessage.sender_type === 'admin' || latestMessage.sender_type === 'super admin' || latestMessage.sender_type === 'superadmin')) {
        console.log('📨 New admin message arrived while in chat - marking as read:', latestMessage.id);
        markMessagesAsRead(supportRoomId);
      }
    }
  }, [messages, supportRoomId, markMessagesAsRead]); // Re-run when new messages arrive
  
  // Convert chat messages to display format
  const displayMessages: Msg[] = messages.map(msg => ({
    id: msg.id,
    text: msg.message,
    me: msg.sender_type === 'customer' // Support messages from customers vs admin
  }));

  const handleTextChange = (text: string) => {
    setInput(text);
    
    // Send typing indicator
    if (isConnected && text.length > 0 && supportRoomId) {
      WebSocketService.sendTypingIndicator(true, supportRoomId);
      
      // Clear previous timeout
      if (localTypingTimeout) {
        clearTimeout(localTypingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        if (supportRoomId) {
          WebSocketService.sendTypingIndicator(false, supportRoomId);
        }
      }, 1000);
      
      setLocalTypingTimeout(timeout);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !supportRoomId) return;
    
    const messageText = input.trim();
    setInput("");
    
    try {
      if (isConnected) {
        // Send via WebSocket - the server will echo back the message which will be added to the store
        console.log('📤 Sending message via WebSocket:', messageText.substring(0, 30) + '...');
        WebSocketService.sendChatMessage(messageText, supportRoomId);
      } else {
        console.log('WebSocket not connected, adding message locally');
        // Only add locally if WebSocket is not connected
        const { addMessage } = useMessageStore.getState();
        const localMessage = {
          id: Date.now().toString(),
          message_id: Date.now().toString(),
          message: messageText,
          sender_id: 'current-user',
          sender_type: 'customer' as const,
          sender_name: 'You',
          room_id: supportRoomId,
          timestamp: Date.now(),
          read: false,
          type: 'text' as const
        };
        addMessage(localMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Mark message as failed and allow retry
    }
    
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 40);
  };



  const Quick = ({ label }: { label: string }) => (
    <Pressable style={[styles.quick, { backgroundColor: "#EEF2F7" }]} onPress={() => setInput(label)}>
      <Text style={{ color: colors.textOnLight }}>{label}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, paddingTop: 40 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      {/* header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.hBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hTitle, { color: colors.text }]}>Support Team</Text>
          <Text style={{ color: "#22C55E", fontSize: 12 }}>Online</Text>
        </View>
        <Pressable style={styles.hBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        data={displayMessages}
        keyExtractor={(m) => m.id}
        ListFooterComponent={() => (
          <>
            {/* Typing Indicator - Simplified for now */}
            {/* TODO: Implement typing indicator with new message store */}
            
            {/* Connection Status */}
            {!isConnected && (
              <View style={styles.connectionStatus}>
                <Text style={[styles.connectionStatusText, { color: colors.sub }]}>
                  Connecting to support...
                </Text>
              </View>
            )}
          </>
        )}
        renderItem={({ item }) => {
          if (item.card) {
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.orderChip, { backgroundColor: "#EAF3FF" }]}>
                  <Text style={{ color: colors.textOnLight, fontWeight: "900" }}>Order #12345</Text>
                  <View style={[styles.badge, { backgroundColor: "#22C55E" }]}><Text style={{ color: "#fff" }}>Delivered</Text></View>
                </View>
                <Text style={{ color: colors.sub, marginTop: 6 }}>3 items • $24.47</Text>
                <Text style={{ color: colors.sub, marginTop: 2 }}>Delivered on Dec 15, 2024</Text>
              </View>
            );
          }
          return (
            <View style={{ alignItems: item.me ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <View
                style={[
                  styles.bubble,
                  item.me
                    ? { backgroundColor: "#FF7A2F" }
                    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text style={{ color: item.me ? "#fff" : colors.text }}>{item.text}</Text>
              </View>
              <Text style={{ color: colors.sub, fontSize: 10, marginTop: 2 }}>{item.me ? "10:36 AM" : "10:35 AM"}</Text>
            </View>
          );
        }}
      />

      {/* quick replies */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: "row", gap: 10 }}>
        <Quick label="Original payment method" />
        <Quick label="Store credit" />
        <Quick label="Thanks!" />
      </View>

      {/* composer */}
      <View style={[styles.composer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          value={input}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor={colors.sub}
          style={{ flex: 1, paddingHorizontal: 12, color: colors.text }}
        />
        <Pressable onPress={handleSendMessage} style={[styles.send, { backgroundColor: colors.brand }]}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { height: 64, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 6 },
  hBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hTitle: { fontWeight: "900", fontSize: 18 },

  bubble: { maxWidth: "78%", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  card: { borderWidth: 1, padding: 12, borderRadius: 14, marginVertical: 4, width: "84%" },
  orderChip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  quick: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  composer: { borderTopWidth: 1, flexDirection: "row", alignItems: "center", padding: 10 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  
  // Typing indicator styles
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingText: {
    fontSize: 14,
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
    backgroundColor: '#999',
    marginHorizontal: 1,
  },
  dot1: {
    // Animation will be handled by Animated API if needed
  },
  dot2: {
    // Animation will be handled by Animated API if needed
  },
  dot3: {
    // Animation will be handled by Animated API if needed
  },
  
  // Connection status styles
  connectionStatus: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  connectionStatusText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
