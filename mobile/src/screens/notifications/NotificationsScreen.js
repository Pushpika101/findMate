import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { notificationsAPI } from '../../services/api';
import { initializeSocket, onNewMessage } from '../../services/socket';
import { DeviceEventEmitter } from 'react-native';
import NotificationItem from '../../components/notifications/NotificationItem';
import COLORS from '../../utils/colors';
import { useFocusEffect } from '@react-navigation/native';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    setupSocket();
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // When the screen becomes focused, refresh notifications silently so the
  // list updates immediately without requiring a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      // silent refresh: don't show the full-screen loading indicator
      fetchNotifications(true);
      fetchUnreadCount();
    }, [])
  );

  const [showMenu, setShowMenu] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const menuButtonRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(80);
  const WINDOW = Dimensions.get('window');
  const MENU_WIDTH = 200;

  const openMenu = () => {
    // show and animate (menu is rendered inside header)
    setMenuPos(null);
    setShowMenu(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true
    }).start();
  };

  const closeMenu = (callback) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true
    }).start(() => {
      setShowMenu(false);
      if (typeof callback === 'function') callback();
    });
  };

  const setupSocket = async () => {
    await initializeSocket();
    
    // Listen for new notifications via socket
    const socket = require('../../services/socket').getSocket();
    if (socket) {
      socket.on('new_notification', (notification) => {
        // avoid adding duplicate notifications with same id
        setNotifications((prev) => {
          try {
            const nid = String(notification?.id ?? notification?._id ?? JSON.stringify(notification));
            const exists = prev.some((n) => String(n?.id ?? n?._id) === nid);
            if (exists) return prev;
            return [notification, ...prev];
          } catch (err) {
            // fallback: if anything goes wrong, prepend but guard by shallow equality
            if (prev.length && JSON.stringify(prev[0]) === JSON.stringify(notification)) return prev;
            return [notification, ...prev];
          }
        });
        setUnreadCount((prev) => prev + 1);
      });
    }
  };

  // fetchNotifications(silent = true) will not toggle the full-screen loading state.
  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await notificationsAPI.getAll({ limit: 100 });
      if (response && response.success) {
        // dedupe notifications by id when setting initial list
        const seen = new Set();
        const deduped = [];
        (response.data.notifications || []).forEach((n) => {
          const id = String(n?.id ?? n?._id ?? JSON.stringify(n));
          if (!seen.has(id)) {
            seen.add(id);
            deduped.push(n);
          }
        });
        setNotifications(deduped);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch notifications');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    await fetchUnreadCount();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await notificationsAPI.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        const newCount = Math.max(0, (unreadCount || 0) - 1);
        setUnreadCount(newCount);
        DeviceEventEmitter.emit('notificationBadgeUpdated', newCount);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.related_item_id) {
      navigation.navigate('ItemDetail', { itemId: notification.related_item_id });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsAPI.delete(notificationId);
              // determine if the deleted notification was unread so we can
              // decrement the badge correctly
              const wasUnread = notifications.some((n) => n.id === notificationId && !n.is_read);
              const newCount = wasUnread ? Math.max(0, (unreadCount || 0) - 1) : (unreadCount || 0);
              setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
              setUnreadCount(newCount);
              // notify other parts of the app (MainTabNavigator) that the badge changed
              DeviceEventEmitter.emit('notificationBadgeUpdated', newCount);
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      DeviceEventEmitter.emit('notificationBadgeUpdated', 0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to mark all as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all notifications one by one
              for (const notification of notifications) {
                await notificationsAPI.delete(notification.id);
              }
              setNotifications([]);
              setUnreadCount(0);
              DeviceEventEmitter.emit('notificationBadgeUpdated', 0);
            } catch (error) {
              Alert.alert('Error', error || 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const renderNotification = ({ item }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'unread'
          ? 'All caught up! You have no unread notifications.'
          : 'When you get notifications, they will appear here.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { position: 'relative' }]} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openMenu}
            accessible
            accessibilityLabel="Open notification options"
            ref={menuButtonRef}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        )}
        {/* Render menu inside header so it doesn't cover list */}
        {showMenu && (
          <Animated.View
            style={[
              styles.floatingMenu,
              {
                position: 'absolute',
                right: 12,
                top: Math.max(12, headerHeight - 8),
                width: MENU_WIDTH,
                opacity: anim,
                transform: [
                  { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }
                ]
              }
            ]}
          >
            {/* caret */}
            <View style={styles.menuCaretContainer} pointerEvents="none">
              <View style={styles.menuCaret} />
            </View>

            <TouchableOpacity
              style={[styles.menuItemRow, styles.menuItemRead]}
              onPress={() => closeMenu(() => handleMarkAllAsRead())}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>✅</Text>
              <Text style={styles.menuItemText}>Mark All as Read</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItemRow, styles.menuItemDestructiveRow]}
              onPress={() => closeMenu(() => handleClearAll())}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🗑️</Text>
              <Text style={[styles.menuItemText, styles.menuItemDestructiveText]}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItemRow, styles.menuItemCancelRow]}
              onPress={() => closeMenu()}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>✖️</Text>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Filter Tabs */}
      {notifications.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'unread' && styles.filterTabActive
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'unread' && styles.filterTabTextActive
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {/* invisible overlay below header to close menu when tapping outside */}
      {showMenu && (
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <View style={[styles.restOverlay, { top: headerHeight }]} />
        </TouchableWithoutFeedback>
      )}
      {filteredNotifications.length === 0 ? (
        // Render a fixed, non-scrolling empty state so the "No notifications" message doesn't scroll
        <ScrollView
          contentContainerStyle={styles.emptyListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          ListFooterComponent={<View style={{ height: 100 }} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'visible'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9
  },
  menuButton: {
    width: 45,
    height: 45,
    borderRadius: 40,
    backgroundColor: COLORS.black ,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },
  menuIcon: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
    lineHeight: 45,
    textAlign: 'center'
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100
  },
  filterTabActive: {
    backgroundColor: COLORS.black
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  filterTabTextActive: {
    color: COLORS.white
  },
  listContent: {
    padding: 16
  },
  emptyListContent: {
    flex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  }
  ,
  floatingMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 4,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 9999
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  menuItemIcon: {
    fontSize: 16,
    marginRight: 12
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.textPrimary
  },
  menuItemDestructive: {},
  menuItemDestructiveText: {
    color: COLORS.danger || '#d9534f'
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8
  },
  menuCaretContainer: {
    position: 'absolute',
    right: 28,
    top: -6,
    width: 16,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white
  },
  menuItemRead: {
    backgroundColor: COLORS.successLight || '#eaf6ec',
    borderWidth: 1,
    borderColor: COLORS.success || '#2e7d32',
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8
  },
  menuItemDestructiveRow: {
    backgroundColor: COLORS.dangerLight || '#fff0f0',
    borderWidth: 1,
    borderColor: COLORS.danger || '#c62828',
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8
  },
  menuItemCancelRow: {
    backgroundColor: COLORS.gray50 || '#f7f7f7',
    borderWidth: 1,
    borderColor: COLORS.border || '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8
  }
  ,
  restOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000
  }
});

export default NotificationsScreen;