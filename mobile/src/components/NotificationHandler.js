import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function NotificationHandler() {
  const receivedListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
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
      // Optionally navigate to a specific screen using deep link or navigation ref
      // For now, just log
      console.log('Notification response received:', response);
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
