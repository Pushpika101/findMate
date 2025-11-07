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
    // Wrap the token fetch in a small retry/backoff because network or Expo service
    // hiccups (503 / upstream connect errors) can be transient.
    const maxAttempts = 3;
    let attempt = 0;
    let token = null;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const tokenData = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();
        token = tokenData?.data ?? null;
        if (token) break;
      } catch (err) {
        // Log and retry unless we've exhausted attempts
        console.warn(`getExpoPushTokenAsync attempt ${attempt} failed:`, err?.message || err);
        if (attempt < maxAttempts) {
          // exponential backoff
          const waitMs = 500 * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, waitMs));
          continue;
        }
        // final failure: rethrow to be handled by outer try/catch
        throw err;
      }
    }

    // Send token to backend to register for this user
    try {
      if (token) {
        await notificationsAPI.registerToken(token);
      }
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
    // If this is a network / upstream error (503) surface a friendly alert once
    // but don't spam the user. Provide guidance to check network or Expo status.
    try {
      const msg = error?.message || String(error);
      if (/503|upstream connect error|connection termination|ECONNREFUSED/i.test(msg)) {
        Alert.alert(
          'Push registration failed',
          'Could not contact Expo push service. This may be a temporary network or Expo outage. Push notifications will be disabled until this is resolved.'
        );
      }
    } catch (_) {}

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
