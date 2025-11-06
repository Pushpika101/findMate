import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { chatAPI } from '../../services/api';
import COLORS from '../../utils/colors';
import { initializeSocket, onNewMessage, removeMessageListener } from '../../services/socket';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/constants';

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setupSocket();
    // initial full load (shows loader if no chats yet)
    fetchChats();
  }, []);

  // When the screen becomes focused, refresh chats silently so the list
  // updates immediately without requiring a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      // silent refresh: don't show the full-screen loading indicator
      fetchChats(true);
    }, [])
  );

  const setupSocket = async () => {
    await initializeSocket();
    
    // Listen for new messages to update chat list
    onNewMessage((newMessage) => {
      handleIncomingMessage(newMessage);
    });
  };

  useEffect(() => {
    return () => {
      removeMessageListener();
    };
  }, []);

  // Listen for chat read events emitted from ChatScreen so we can clear the unread badge
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('chatMarkedRead', (readChatId) => {
      if (!readChatId) return;
      setChats((prev) => {
        const next = prev.map((c) => (c.id === readChatId ? { ...c, unread_count: 0 } : c));
        // recompute total unread across chats and emit so main navigator updates badge
        try {
          const totalUnread = next.reduce((acc, it) => acc + (Number(it.unread_count) || 0), 0);
          DeviceEventEmitter.emit('chatBadgeUpdated', totalUnread);
        } catch (e) {
          // ignore emit errors
        }
        return next;
      });
    });

    return () => sub.remove();
  }, []);

  const { user } = useAuth();

  const handleIncomingMessage = (newMessage) => {
    if (!newMessage || !newMessage.chat_id) return;

    setChats((prev) => {
      // find existing chat
      const idx = prev.findIndex((c) => c.id === newMessage.chat_id);
      // build update fields
      const update = {
        ... (idx !== -1 ? prev[idx] : {}),
        last_message: newMessage.message_text || prev[idx]?.last_message,
        last_message_time: newMessage.created_at || prev[idx]?.last_message_time,
      };

      // increment unread only if message is from other user
      if (newMessage.sender_id !== user?.id) {
        update.unread_count = (prev[idx]?.unread_count || 0) + 1;
      }

      if (idx === -1) {
        // unknown chat; trigger a full refresh to get latest chats
        fetchChats();
        return prev;
      }

      // move updated chat to front
      const next = [...prev];
      next.splice(idx, 1);
      next.unshift(update);
      // recompute total unread across chats and emit event so MainTabNavigator updates badge
      try {
        const totalUnread = next.reduce((acc, it) => acc + (Number(it.unread_count) || 0), 0);
        DeviceEventEmitter.emit('chatBadgeUpdated', totalUnread);
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const normalizeImageUrl = (uri) => {
    if (!uri) return null;
    try {
      const parsed = new URL(uri);
      const host = parsed.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        // Replace origin with API base origin
        const apiOrigin = API_URL.replace(/\/api\/?$/, '');
        return apiOrigin + parsed.pathname + parsed.search + parsed.hash;
      }
      return uri;
    } catch (err) {
      // uri might be a relative path like /uploads/xxx
      const apiOrigin = API_URL.replace(/\/api\/?$/, '');
      if (uri.startsWith('/')) return apiOrigin + uri;
      return uri;
    }
  };

  // fetchChats(silent=true) will not toggle the full-screen loading state.
  const fetchChats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await chatAPI.getAll();
      if (response && response.success) {
        setChats(response.data.chats);
        // compute total unread across chats and emit so main navigator updates badge
        try {
          const totalUnread = (response.data.chats || []).reduce((acc, it) => acc + (Number(it.unread_count) || 0), 0);
          DeviceEventEmitter.emit('chatBadgeUpdated', totalUnread);
        } catch (e) {}
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch chats');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }, []);

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => openChat(item)}
    >
      {item.other_user_photo ? (
        <Image
          source={{ uri: normalizeImageUrl(item.other_user_photo) }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.other_user_name?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.other_user_name}</Text>
          <Text style={styles.time}>
            {item.last_message_time
              ? new Date(item.last_message_time).toLocaleDateString()
              : new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.itemName} numberOfLines={1}>
          📦 {item.item_name}
        </Text>

        <View style={styles.lastMessageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDeleteChat(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const openChat = async (item) => {
    const id = item.id;
    // Optimistically clear unread badge in UI
    if (item.unread_count > 0) {
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)));
      try {
        // mark as read on server (chatAPI.markAsRead exists and is used in ChatScreen)
        await chatAPI.markAsRead(id);
        // After marking as read, fetch fresh unread count and emit to main navigator so its badge updates immediately
        const res = await chatAPI.getUnreadCount?.();
        if (res && res.success) {
          DeviceEventEmitter.emit('chatBadgeUpdated', res.data.unreadCount || 0);
        }
      } catch (err) {
        console.warn('Failed to mark chat as read', err);
        // If desired, we could revert the optimistic update here. For now, keep UI consistent
        // and rely on server sync or pull-to-refresh to correct state if needed.
      }
    }

    navigation.navigate('ChatScreen', { chatId: id });
  };

  const confirmDeleteChat = (id) => {
    Alert.alert(
      'Delete chat?',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteChat(id) }
      ]
    );
  };

  const handleDeleteChat = async (id) => {
    try {
      setLoading(true);
      const response = await chatAPI.delete(id);
      if (response && response.success) {
        setChats((prev) => {
          const next = prev.filter((c) => c.id !== id);
          try {
            const totalUnread = next.reduce((acc, it) => acc + (Number(it.unread_count) || 0), 0);
            DeviceEventEmitter.emit('chatBadgeUpdated', totalUnread);
          } catch (e) {}
          return next;
        });
      } else {
        Alert.alert('Error', response?.message || 'Failed to delete chat');
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to delete chat');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Chats List */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        ListFooterComponent={<View style={{ height: 100 }} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={chats.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>
              Start chatting with people about lost or found items!
            </Text>
          </View>
        }
      />
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
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white
  },
  listContent: {
    padding: 16
  },
  emptyListContent: {
    flex: 1
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.kk2,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  },
  chatInfo: {
    flex: 1
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  itemName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary
  },
  unreadBadge: {
    backgroundColor: COLORS.lost,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8
  },
  unreadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40
  }
  ,
  deleteButton: {
    marginLeft: 8,
    width: 55,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lost,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButtonText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 18
  }
});

export default ChatListScreen;