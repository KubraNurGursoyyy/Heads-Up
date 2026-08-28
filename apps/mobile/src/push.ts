import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

function openNotificationUrl(notification: Notifications.Notification) {
  const url = notification.request.content.data?.url;
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) void Linking.openURL(url);
}

export function subscribePushResponses() {
  const last = Notifications.getLastNotificationResponse();
  if (last?.notification) openNotificationUrl(last.notification);
  return Notifications.addNotificationResponseReceivedListener(response => openNotificationUrl(response.notification));
}

export async function registerPush() {
  if (!Device.isDevice) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('important-news', {
      name: 'Önemli haberler',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
    await Notifications.setNotificationChannelAsync('system-alerts', {
      name: 'HeadsUp sistem uyarıları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api('/devices', { method: 'POST', body: JSON.stringify({ expoPushToken: token, deviceName: Device.modelName || 'Android' }) });
}
