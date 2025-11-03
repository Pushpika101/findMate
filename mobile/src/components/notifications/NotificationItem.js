import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from '../../utils/colors';

const NotificationItem = ({ notification, onPress, onDelete }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_item':
        return '📢';
      case 'match_found':
        return '✨';
      case 'item_claimed':
        return '🙋';
      case 'new_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_item':
        return COLORS.info;
      case 'match_found':
        return COLORS.success;
      case 'item_claimed':
        return COLORS.warning;
      case 'new_message':
        return COLORS.primary;
      default:
        return COLORS.gray500;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.unreadContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type) + '20' }
        ]}
      >
        <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
          {!notification.is_read && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  unreadContainer: {
    backgroundColor: COLORS.primaryLight + '10',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 24
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  time: {
    fontSize: 12,
    color: COLORS.textTertiary
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  deleteIcon: {
    fontSize: 14,
    color: COLORS.textSecondary
  }
});

export default NotificationItem;