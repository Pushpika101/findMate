import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import {
  initializeSocket,
  joinChat,
  leaveChat,
  sendTypingIndicator,
  onNewMessage,
  onUserTyping,
  removeMessageListener,
  removeTypingListener
} from '../../services/socket';
import { DeviceEventEmitter } from 'react-native';

const ChatScreen = ({ route, navigation }) => {
  const { chatId } = route.params;
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    loadingText: { marginTop: 12, fontSize: 16, color: c.textSecondary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: c.background, borderBottomWidth: 1, borderBottomColor: c.border },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 28, color: c.primary },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' },
    headerAvatarText: { fontSize: 18, fontWeight: 'bold', color: c.white },
    headerName: { fontSize: 16, fontWeight: '600', color: c.textInverse },
    typingIndicator: { fontSize: 12, color: c.primary, fontStyle: 'italic' },
    placeholder: { width: 40 },
    itemInfoContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: c.primaryLight + '20', borderBottomWidth: 1, borderBottomColor: c.border },
    itemThumbnail: { width: 50, height: 50, borderRadius: 8, backgroundColor: c.gray200 },
    itemInfoText: { flex: 1, marginLeft: 12 },
    itemInfoLabel: { fontSize: 11, color: c.textSecondary, marginBottom: 2 },
    itemInfoName: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
    itemInfoLocation: { fontSize: 12, color: c.textSecondary },
    itemInfoArrow: { fontSize: 24, color: c.textSecondary, marginLeft: 8 },
    messagesList: { padding: 16, flexGrow: 1 },
    messageContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
    myMessageContainer: { justifyContent: 'flex-end' },
    otherMessageContainer: { justifyContent: 'flex-start' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    avatarText: { fontSize: 14, fontWeight: 'bold', color: c.white },
    avatarSpacer: { width: 40 },
    senderName: { fontSize: 12, color: c.textSecondary, marginBottom: 4, marginLeft: 12 },
    messageBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, maxWidth: '80%' },
    myMessageBubble: { backgroundColor: c.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    otherMessageBubble: { backgroundColor: c.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.border },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: c.white },
    otherMessageText: { color: c.black },
    messageTime: { fontSize: 11, color: c.textSecondary, marginTop: 4, marginLeft: 12 },
    myMessageTime: { textAlign: 'right', marginRight: 12, marginLeft: 0 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: c.textPrimary, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: c.textSecondary },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border, gap: 12 },
    input: { flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: c.gray100, borderRadius: 20, fontSize: 15, color: c.textPrimary },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { opacity: 0.5 },
    sendButtonText: { fontSize: 20, color: c.black }
  }));

  useEffect(() => {
    setupSocket();
    fetchChatData();

    return () => {
      leaveChat(chatId);
      removeMessageListener();
      removeTypingListener();
    };
  }, [chatId]);

  const setupSocket = async () => {
    await initializeSocket();
    joinChat(chatId);

    // Listen for new messages
    onNewMessage((newMessage) => {
      if (newMessage.chat_id === chatId) {
        setMessages((prev) => {
          // Deduplicate: if we have a temp optimistic message (created locally) that matches
          // the incoming server message (same sender and text within a short time window),
          // replace the temp message with the server message. Otherwise append.
          const existsSimilarIndex = prev.findIndex((m) => {
            // exact id match
            if (m.id === newMessage.id) return true;

            // match by same sender and identical text and a proximate timestamp (5s)
            if (m.sender_id === newMessage.sender_id && m.message_text === newMessage.message_text) {
              try {
                const a = new Date(m.created_at).getTime();
                const b = new Date(newMessage.created_at).getTime();
                return Math.abs(a - b) <= 5000; // 5 seconds
              } catch (e) {
                return false;
              }
            }

            return false;
          });

          if (existsSimilarIndex !== -1) {
            // Replace the temp message with the authoritative server message
            const next = [...prev];
            next[existsSimilarIndex] = newMessage;
            return next;
          }

          return [...prev, newMessage];
        });
        scrollToBottom();

        // Mark as read if from other user
        if (newMessage.sender_id !== user.id) {
          markAsRead();
        }
      }
    });

    // Listen for typing indicator
    onUserTyping(({ userId, isTyping }) => {
      if (userId !== user.id) {
        setOtherUserTyping(isTyping);
      }
    });
  };

  const fetchChatData = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getById(chatId);
      if (response.success) {
        setChat(response.data.chat);
        setMessages(response.data.messages);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to load chat');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await chatAPI.markAsRead(chatId);
      // notify other screens (chat list / main tab) that this chat was marked read
      try {
        // emit chat marked read so chat list can clear its unread badge immediately
        DeviceEventEmitter.emit('chatMarkedRead', chatId);

        // fetch authoritative unread count and emit to main tab so its badge updates
        const res = await chatAPI.getUnreadCount?.();
        if (res && res.success) {
          DeviceEventEmitter.emit('chatBadgeUpdated', res.data.unreadCount || 0);
        }
      } catch (e) {
        // non-fatal — log and continue
        console.warn('Failed to emit chat read events', e);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const tempMessage = {
      id: Date.now(),
      chat_id: chatId,
      sender_id: user.id,
      message_text: messageText.trim(),
      created_at: new Date().toISOString(),
      sender_name: user.name,
      is_read: false
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessageText('');
    scrollToBottom();

    try {
      setSending(true);
      await chatAPI.sendMessage(chatId, messageText.trim());
    } catch (error) {
      Alert.alert('Error', error || 'Failed to send message');
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text) => {
    setMessageText(text);

    // Send typing indicator
    sendTypingIndicator(chatId, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(chatId, false);
    }, 2000);
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender_id === user.id;
    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== item.sender_id;
    const showName = !isMyMessage && showAvatar;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
      >
        {!isMyMessage && showAvatar && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.sender_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}

        <View style={{ flex: 1 }}>
          {showName && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText
              ]}
            >
              {item.message_text}
            </Text>
          </View>
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderItemInfo = () => {
    if (!chat) return null;

    return (
      <TouchableOpacity
        style={styles.itemInfoContainer}
        onPress={() => navigation.navigate('ItemDetail', { itemId: chat.item_id })}
      >
        {chat.item_photo && (
          <Image source={{ uri: chat.item_photo }} style={styles.itemThumbnail} />
        )}
        <View style={styles.itemInfoText}>
          <Text style={styles.itemInfoLabel}>About this item:</Text>
          <Text style={styles.itemInfoName} numberOfLines={1}>
            {chat.item_name}
          </Text>
          <Text style={styles.itemInfoLocation} numberOfLines={1}>
            📍 {chat.location}
          </Text>
        </View>
        <Text style={styles.itemInfoArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {chat?.other_user_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{chat?.other_user_name}</Text>
            {otherUserTyping && (
              <Text style={styles.typingIndicator}>typing...</Text>
            )}
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Item Info */}
      {renderItemInfo()}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={handleTyping}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
// styles are created with useThemedStyles inside the component

export default ChatScreen;