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
import { chatAPI } from '../../services/api';
import COLORS from '../../utils/colors';
import { initializeSocket, onNewMessage } from '../../services/socket';

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setupSocket();
    fetchChats();
  }, []);

  const setupSocket = async () => {
    await initializeSocket();
    
    // Listen for new messages to update chat list
    onNewMessage(() => {
      fetchChats();
    });
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getAll();
      if (response.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to fetch chats');
    } finally {
      setLoading(false);
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
      onPress={() => navigation.navigate('ChatScreen', { chatId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.other_user_name?.charAt(0).toUpperCase()}
        </Text>
      </View>

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
        setChats((prev) => prev.filter((c) => c.id !== id));
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
    shadowOpacity: 0.25,
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
    backgroundColor: COLORS.primary,
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