import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { notificationsAPI } from './api';

// Configure how notifications are shown when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    // Note: on simulators this may not return a usable token. Prefer testing on a physical device.

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Attempt to read projectId from app config (expo.dev) or environment
    const projectId =
      (Constants?.expoConfig && (Constants.expoConfig.projectId || Constants.expoConfig.extra?.projectId)) ||
      Constants?.manifest?.extra?.projectId ||
      process.env.EXPO_PROJECT_ID ||
      null;

    // Pass projectId if available to satisfy SDK requirements when using dev clients
    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Send token to backend to register for this user
    try {
      await notificationsAPI.registerToken(token);
    } catch (err) {
      console.error('Failed to register push token with backend:', err);
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('registerForPushNotificationsAsync error', error);
    return null;
  }
}

// Optional: helper to show a local notification
export async function presentLocalNotification({ title, body, data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  } catch (error) {
    console.error('presentLocalNotification error', error);
  }
}
