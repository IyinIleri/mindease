import { Stack } from 'expo-router';
import './global.css';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import {
  registerForPushNotifications,
  scheduleEveningJournalReminder,
  scheduleWeeklySummaryNotification,
} from '../services/notifications';

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const granted = await registerForPushNotifications();
    if (granted) {
      // Only schedule the 9PM journal reminder and Sunday weekly summary
      // No notification fires when the user opens the app
      await scheduleEveningJournalReminder();
      await scheduleWeeklySummaryNotification();
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
