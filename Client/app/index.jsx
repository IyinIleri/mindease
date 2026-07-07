import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './SplashScreen';

export default function Index() {
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = async () => {
    setSplashDone(true);
    await navigate();
  };

  const navigate = async () => {
    try {
      const [seen, userId, obDone] = await Promise.all([
        AsyncStorage.getItem('seenOnboarding'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('onboardingDone'),
      ]);

      if (!seen) {
        // Brand new install — show onboarding
        router.replace('/OnboardingScreen');
      } else if (!userId) {
        // Has seen onboarding but not logged in
        router.replace('/Login');
      } else if (!obDone) {
        // Logged in but never completed questions
        router.replace('/OnboardingQuestions');
      } else {
        // Fully set up returning user — go straight to home
        router.replace('/HomeScreen');
      }
    } catch (e) {
      // Fallback if AsyncStorage fails
      router.replace('/Login');
    }
  };

  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return null;
}
