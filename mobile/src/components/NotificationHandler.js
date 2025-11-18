import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { navigate } from '../navigation/RootNavigation';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

export default function NotificationHandler() {
  const receivedListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Attempt to register for push notifications and send token to backend
    // The helper handles permission prompts and backend registration.
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('Push token registered:', token);
        } else {
          console.log('No push token obtained');
        }
      } catch (err) {
        console.warn('registerForPushNotificationsAsync failed', err);
      }
    })();

    // Listener when a notification is received while the app is foregrounded
    receivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      // You can show an in-app UI or handle silently
      // For now, show a small alert
      const { title, body } = notification.request.content;
      if (title || body) {
        Alert.alert(title || 'Notification', body || 'You have a new notification');
      }
    });

    // Listener when user interacts with a notification (tap, action)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // response.actionIdentifier, response.notification
      // Try to navigate to chat if the notification payload contains a chatId
      try {
        const notif = response?.notification;
        const data = notif?.request?.content?.data || {};

        // Support a few common shapes: { chatId }, { chat: { id } }
        const chatId = data.chatId || (data.chat && data.chat.id) || data?.payload?.chatId;

        if (chatId) {
          // Navigate to ChatScreen with the chatId
          navigate('ChatScreen', { chatId });
          return;
        }

        // fallback: log for debugging
        console.log('Notification response received (no chatId):', response);
      } catch (err) {
        console.warn('Failed to handle notification response', err);
      }
    });

    return () => {
      // Remove subscriptions using the subscription object's remove() if available.
      if (receivedListener.current && typeof receivedListener.current.remove === 'function') {
        try { receivedListener.current.remove(); } catch (_) {}
      }
      if (responseListener.current && typeof responseListener.current.remove === 'function') {
        try { responseListener.current.remove(); } catch (_) {}
      }
    };
  }, []);

  return null;
}
