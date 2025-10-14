import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigationAdapter } from '../../hooks/useNavigationAdapter';

interface Notification {
  id: string;
  type: 'support_reply' | 'promo' | 'maintenance' | 'order_update';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  canOpen: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'support_reply',
    title: 'Support Reply',
    message: 'Your support ticket has been updated with a new response.',
    timestamp: '2 minutes ago',
    isRead: false,
    canOpen: true,
    icon: 'chatbubble-ellipses',
  },
  {
    id: '2',
    type: 'promo',
    title: 'Special Offer!',
    message: 'Get 20% off on all vegetables this weekend. Limited time offer!',
    timestamp: '1 hour ago',
    isRead: false,
    canOpen: false,
    icon: 'pricetag',
  },
  {
    id: '3',
    type: 'order_update',
    title: 'Order Delivered',
    message: 'Your order #12345 has been successfully delivered.',
    timestamp: '3 hours ago',
    isRead: true,
    canOpen: false,
    icon: 'checkmark-circle',
  },
  {
    id: '4',
    type: 'maintenance',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM.',
    timestamp: '1 day ago',
    isRead: true,
    canOpen: false,
    icon: 'construct',
  },
  {
    id: '5',
    type: 'support_reply',
    title: 'Support Reply',
    message: 'Thank you for contacting us. We have received your inquiry.',
    timestamp: '2 days ago',
    isRead: true,
    canOpen: true,
    icon: 'chatbubble-ellipses',
  },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationAdapter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const handleNotificationPress = (notification: Notification) => {
    if (notification.canOpen && notification.type === 'support_reply') {
      // Navigate to support chat
      navigation.navigate('SupportChat');
    } else {
      // Show alert for non-openable notifications
      Alert.alert(
        notification.title,
        notification.message,
        [{ text: 'OK', style: 'default' }]
      );
    }

    // Mark as read
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'support_reply':
        return colors.brand;
      case 'promo':
        return '#10B981'; // Green
      case 'maintenance':
        return '#F59E0B'; // Yellow
      case 'order_update':
        return '#3B82F6'; // Blue
      default:
        return colors.sub;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: colors.brand }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={colors.sub} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptyMessage, { color: colors.sub }]}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                {
                  backgroundColor: notification.isRead ? colors.card : colors.brand + '10',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContent}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: getNotificationColor(notification.type) + '20' }
                ]}>
                  <Ionicons
                    name={notification.icon}
                    size={20}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[
                      styles.notificationTitle,
                      {
                        color: colors.text,
                        fontWeight: notification.isRead ? '600' : '800',
                      },
                    ]}>
                      {notification.title}
                    </Text>
                    {!notification.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />
                    )}
                  </View>
                  
                  <Text style={[
                    styles.notificationMessage,
                    { color: colors.sub },
                  ]}>
                    {notification.message}
                  </Text>
                  
                  <Text style={[
                    styles.timestamp,
                    { color: colors.sub },
                  ]}>
                    {notification.timestamp}
                  </Text>
                </View>
                
                {notification.canOpen && (
                  <Ionicons name="chevron-forward" size={16} color={colors.sub} />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  notificationItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
});