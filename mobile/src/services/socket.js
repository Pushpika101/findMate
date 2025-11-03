import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { getToken } from './storage';

let socket = null;

// Initialize socket connection
export const initializeSocket = async () => {
  const token = await getToken();
  
  if (!token) {
    console.log('No token available for socket connection');
    return null;
  }

  if (socket?.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

// Get socket instance
export const getSocket = () => {
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};

// Join chat room
export const joinChat = (chatId) => {
  if (socket) {
    socket.emit('join_chat', chatId);
    console.log('Joined chat:', chatId);
  }
};

// Leave chat room
export const leaveChat = (chatId) => {
  if (socket) {
    socket.emit('leave_chat', chatId);
    console.log('Left chat:', chatId);
  }
};

// Send typing indicator
export const sendTypingIndicator = (chatId, isTyping) => {
  if (socket) {
    socket.emit('typing', { chatId, isTyping });
  }
};

// Listen for new messages
export const onNewMessage = (callback) => {
  if (socket) {
    socket.on('new_message', callback);
  }
};

// Listen for typing indicator
export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user_typing', callback);
  }
};

// Remove listeners
export const removeMessageListener = () => {
  if (socket) {
    socket.off('new_message');
  }
};

export const removeTypingListener = () => {
  if (socket) {
    socket.off('user_typing');
  }
};

export const onNotification = (callback) => {
  if (socket) {
    socket.on('new_notification', callback);
  }
};

export const removeNotificationListener = () => {
  if (socket) {
    socket.off('new_notification');
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinChat,
  leaveChat,
  sendTypingIndicator,
  onNewMessage,
  onUserTyping,
  removeMessageListener,
  removeTypingListener
};

