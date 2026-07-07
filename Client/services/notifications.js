import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const BRAND_PRIMARY = '#7C3AED';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Register with branded channels ──────────────────────────────────────────
export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mindease-journal', {
      name: 'MindEase — Journal Reminders',
      description: 'Reminds you to write in your journal by 9 PM',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 150, 300],
      lightColor: BRAND_PRIMARY,
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('mindease-weekly', {
      name: 'MindEase — Weekly Summary',
      description: 'Sunday mood summary notification',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: BRAND_PRIMARY,
      sound: 'default',
    });
  }

  return finalStatus;
}

// ─── 9PM journal reminder (fires every night) ─────────────────────────────────
// The app checks AsyncStorage on each journal save to mark today as done.
// The notification fires at 9PM every night as a reminder.
export async function scheduleEveningJournalReminder() {
  // Cancel any old notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'MindEase — Journal Reminder',
      body: "Take 2 minutes to write how your day went. Your streak is counting on you.",
      sound: 'default',
      color: BRAND_PRIMARY,
      data: { screen: 'JournalScreen' },
    },
    trigger: {
      hour: 21,
      minute: 0,
      repeats: true,
      channelId: 'mindease-journal',
    },
  });
}

// ─── Sunday 7PM weekly summary ────────────────────────────────────────────────
export async function scheduleWeeklySummaryNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'MindEase — Weekly Recap',
      body: 'A new week starts tomorrow. Open MindEase to see how your mood tracked this week.',
      sound: 'default',
      color: BRAND_PRIMARY,
      data: { screen: 'MoodStats' },
    },
    trigger: {
      weekday: 1,  // Sunday
      hour: 19,
      minute: 0,
      repeats: true,
      channelId: 'mindease-weekly',
    },
  });
}

// ─── Send immediate notification (programmatic use) ──────────────────────────
export async function sendImmediateNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default', color: BRAND_PRIMARY },
    trigger: null,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
