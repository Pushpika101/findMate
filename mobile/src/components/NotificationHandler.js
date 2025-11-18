import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { navigate, navigationRef } from '../navigation/RootNavigation';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationHandler() {
  const receivedListener = useRef();
  const responseListener = useRef();
  const queuedResponseRef = useRef(null);
  const { loading: authLoading } = useAuth();

  // Centralized handler for notification responses. If auth is initializing
  // the response will be queued and processed once auth finishes loading.
  const handleNotificationResponse = async (response) => {
    if (authLoading) {
      queuedResponseRef.current = response;
      console.log('Auth still loading — queued notification response for later processing');
      return;
    }

    try {
      const notif = response?.notification;
      // do not persist debug payload in production handler
      const data = notif?.request?.content?.data || {};

      // Robust key detection: normalize property names by removing
      // non-alphanumeric characters and lowercasing. This lets us
      // tolerate malformed server keys like "related|tem|d".
      const normalize = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

      let chatId = null;
      // Check top-level keys first by normalization
      for (const key of Object.keys(data || {})) {
        const n = normalize(key);
        if (n === 'chatid' || n === 'conversationid' || n === 'roomid') {
          chatId = data[key];
          break;
        }
      }

      // fallback nested shapes
      if (!chatId && data.chat && data.chat.id) chatId = data.chat.id;
      if (!chatId && data.conversation && data.conversation.id) chatId = data.conversation.id;
      if (!chatId && data.payload && (data.payload.chatId || data.payload.chat_id)) {
        chatId = data.payload.chatId || data.payload.chat_id;
      }
      // url deep-link fallback: extract numeric id
      if (!chatId && typeof data.url === 'string') {
        const m = data.url.match(/chat\/(\d+)/i);
        if (m && m[1]) chatId = m[1];
      }

      if (chatId) {
        // Prefer a navigation reset so any intermediate ItemDetail route
        // doesn't remain on the stack (prevents Item screen flashing).
        try {
          if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
            navigationRef.reset({
              index: 1,
              routes: [
                { name: 'MainTabs' },
                { name: 'ChatScreen', params: { chatId } }
              ]
            });
            return;
          }
        } catch (err) {
          // fallback to simple navigate
          console.warn('reset navigation failed, falling back to navigate', err);
        }

        navigate('ChatScreen', { chatId });
        return;
      }

      // Resolve from itemId + participant id via backend
      // Find itemId by normalizing keys as well (handles malformed names)
      let itemId = null;
      for (const key of Object.keys(data || {})) {
        const n = normalize(key);
        if (n === 'itemid' || n === 'relateditemid' || n === 'relateditem') {
          itemId = data[key];
          break;
        }
      }
      // also try common direct properties
      if (!itemId) itemId = data.itemId || data.item_id || data.item;

      if (itemId) {
        const participantKeys = ['senderId', 'sender_id', 'fromUserId', 'from_user_id', 'otherUserId', 'other_user_id', 'recipientId', 'recipient_id', 'userId', 'user_id'];
        let recipientId = null;
        // flexible lookup for participant id (normalize keys)
        for (const key of Object.keys(data || {})) {
          const n = normalize(key);
          if (n === 'senderid' || n === 'recipientid' || n === 'userid' || n === 'fromuserid' || n === 'otheruserid') {
            recipientId = data[key];
            break;
          }
        }
        // fallback to typical keys
        if (!recipientId) for (const k of participantKeys) { if (data[k]) { recipientId = data[k]; break; } }
        if (recipientId) {
          try {
            const res = await chatAPI.create({ itemId, recipientId });
            const returnedChatId = res?.data?.data?.chatId || res?.data?.chatId || res?.data?.data?.chatId;
            if (returnedChatId) {
              try {
                if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
                  navigationRef.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'ChatScreen', params: { chatId: returnedChatId } }] });
                  return;
                }
              } catch (err) {
                console.warn('reset navigation failed, falling back to navigate', err);
              }
              navigate('ChatScreen', { chatId: returnedChatId });
              return;
            }
          } catch (err) {
            console.warn('Failed to resolve chatId from itemId via backend', err);
          }
        }
        // If we didn't have a recipientId, try to find an existing chat for this item
        try {
          const listRes = await chatAPI.getAll?.();
          const chats = listRes?.data?.data?.chats || listRes?.data?.chats || [];
          const match = chats.find(c => String(c.item_id || c.itemId || c.item_id) === String(itemId) || String(c.item_id) === String(itemId));
          if (match && match.id) {
            try {
              if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
                navigationRef.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'ChatScreen', params: { chatId: match.id } }] });
                return;
              }
            } catch (err) {
              console.warn('reset navigation failed, falling back to navigate', err);
            }
            navigate('ChatScreen', { chatId: match.id });
            return;
          }
        } catch (err) {
          // ignore failure to list chats
        }
      }

      console.log('Notification response received (no chatId found):', response);
    } catch (err) {
      console.warn('Failed to handle notification response', err);
    }
  };

  // (debug replay registration removed)

  // Process any queued response when auth finishes loading
  useEffect(() => {
    (async () => {
      try {
        if (!authLoading && queuedResponseRef.current) {
          await handleNotificationResponse(queuedResponseRef.current);
          queuedResponseRef.current = null;
        }
      } catch (err) {
        console.warn('Processing queued notification response failed', err);
      }
    })();
  }, [authLoading]);

  useEffect(() => {
    // Attempt to register for push notifications and send token to backend
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) console.log('Push token registered:', token);
        else console.log('No push token obtained');
      } catch (err) {
        console.warn('registerForPushNotificationsAsync failed', err);
      }
    })();

    // Foreground notification listener
    receivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      if (title || body) {
        Alert.alert(title || 'Notification', body || 'You have a new notification');
      }
    });

    // Response listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Cold-start handling
    (async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) await handleNotificationResponse(lastResponse);
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      try { receivedListener.current?.remove?.(); } catch (_) {}
      try { responseListener.current?.remove?.(); } catch (_) {}
    };
  }, []);

  return null;
}
