import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, StatusBar, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { advices } from '../assets/advice.js';
import { useAuth } from '../context/AuthContext';
import { useTheme, moodColor } from '../context/ThemeContext';
import { streakAPI, moodAPI } from '../services/api';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';

dayjs.extend(dayOfYear);
const { width } = Dimensions.get('window');

function getTodaysAdvice(all) {
  return all[dayjs().dayOfYear() % all.length];
}

const MOODS = [
  { mood: 'happy',    icon: 'sunny-outline',         label: 'Happy',   color: '#F59E0B' },
  { mood: 'neutral',  icon: 'ellipse-outline',        label: 'Calm',    color: '#7C3AED' },
  { mood: 'sad',      icon: 'rainy-outline',           label: 'Sad',     color: '#3B82F6' },
  { mood: 'angry',    icon: 'flame-outline',            label: 'Angry',   color: '#EF4444' },
  { mood: 'stressed', icon: 'thunderstorm-outline',    label: 'Stressed',color: '#059669' },
];

const MOOD_TIPS = {
  happy:   'Great energy today. Channel it — write in your journal or reach out to someone.',
  neutral: 'A clear, steady mind is a powerful thing. Stay present.',
  sad:     'It is okay to feel this way. Try writing one small thing you are grateful for.',
  angry:   'Take a breath and step away for a moment. You are bigger than this.',
  stressed:'Your body is asking for a pause. Two minutes of breathing can shift everything.',
};

// ── Animated glow text component ─────────────────────────────────────────────
function GlowText({ children, style, color = '#C084FC' }) {
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View>
      {/* Glow layer */}
      <Animated.Text style={[style, {
        position: 'absolute', opacity: glowAnim,
        textShadowColor: color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
        color: 'transparent',
      }]}>{children}</Animated.Text>
      {/* Real text */}
      <Text style={style}>{children}</Text>
    </View>
  );
}

// ── Fade-in wrapper ───────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 550, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const [selectedMood, setSelectedMood] = useState(null);
  const [streak, setStreak] = useState(null);
  const [moodAnim] = useState(
    MOODS.reduce((a, m) => { a[m.mood] = new Animated.Value(1); return a; }, {})
  );
  const todaysAdvice = useMemo(() => getTodaysAdvice(advices), []);

  // Refresh streak every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      streakAPI.get().then(r => r.success && setStreak(r));
    }, [])
  );

  const handleMoodSelect = async (mood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(mood);

    // Bounce animation
    Animated.sequence([
      Animated.timing(moodAnim[mood], { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(moodAnim[mood], { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const res = await moodAPI.save(mood, '', '', 0.8, '');
    if (res.success) showToast(`Mood saved: ${mood}`, 'success');
  };

  const greeting = () => {
    const h = dayjs().hour();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0].slice(0, 12) : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Header with glow on name ──────────────────────────────────── */}
        <FadeIn delay={0}>
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 12, color: T.textMuted, fontWeight: '600', letterSpacing: 0.8 }}>
                {dayjs().format('dddd, MMM D').toUpperCase()}
              </Text>
              <View style={{ marginTop: 3 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: T.text }}>
                  {greeting()}
                </Text>
                {firstName ? (
                  <GlowText
                    style={{ fontSize: 22, fontWeight: '800', color: T.text }}
                    color={T.accent}>
                    {firstName}
                  </GlowText>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/Profile')}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: T.primary,
                alignItems: 'center', justifyContent: 'center', marginTop: 4,
                shadowColor: T.primary, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                {user?.name ? user.name[0].toUpperCase() : '?'}
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* ── Streak ───────────────────────────────────────────────────── */}
        {streak?.currentStreak > 0 && (
          <FadeIn delay={80}>
            <TouchableOpacity onPress={() => router.push('/MoodStats')}
              style={{ marginHorizontal: 24, marginTop: 16, borderRadius: 20, overflow: 'hidden',
                elevation: 4, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25, shadowRadius: 12 }}>
              <LinearGradient colors={['#F97316', '#EF4444']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Ionicons name="flame" size={28} color="white" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                    {streak.currentStreak} Day Streak
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 1 }}>
                    {streak.journaledToday
                      ? 'Journaled today — well done!'
                      : 'Write today to keep your streak alive'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' }}>BEST</Text>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>{streak.longestStreak}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </FadeIn>
        )}

        {/* ── Daily Reflection card with glowing tagline ───────────────── */}
        <FadeIn delay={160}>
          <View style={{ marginHorizontal: 24, marginTop: 20, borderRadius: 24,
            overflow: 'hidden', elevation: 8, shadowColor: T.primary,
            shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 18 }}>
            <LinearGradient colors={isDark ? ['#4C1D95','#6D28D9'] : ['#6D28D9','#9333EA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
                      padding: 7, marginRight: 10 }}>
                      <Ionicons name="sparkles" size={15} color="white" />
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11,
                      fontWeight: '700', letterSpacing: 1.2 }}>DAILY REFLECTION</Text>
                  </View>
                  <Text style={{ color: 'white', fontSize: 19, fontWeight: '700', lineHeight: 28,
                    textShadowColor: 'rgba(192,132,252,0.5)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 12 }}>
                    {todaysAdvice}
                  </Text>
                </View>
                <LottieView source={require('../assets/images/onboarding1.json')}
                  autoPlay loop style={{ width: 68, height: 68, marginLeft: 12 }} />
              </View>
            </LinearGradient>
          </View>
        </FadeIn>

        {/* ── Mood Picker ──────────────────────────────────────────────── */}
        <FadeIn delay={240}>
          <View style={{ marginHorizontal: 24, marginTop: 26 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 14 }}>
              How are you feeling?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {MOODS.map((item) => {
                const selected = selectedMood === item.mood;
                return (
                  <Animated.View key={item.mood}
                    style={{ transform: [{ scale: moodAnim[item.mood] }] }}>
                    <TouchableOpacity onPress={() => handleMoodSelect(item.mood)}
                      style={{ width: (width - 48 - 36) / 5, paddingVertical: 14,
                        borderRadius: 20, alignItems: 'center',
                        backgroundColor: selected ? item.color + '22' : T.bgCard,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? item.color : T.border,
                        elevation: selected ? 5 : 1,
                        shadowColor: selected ? item.color : T.shadow,
                        shadowOffset: { width: 0, height: selected ? 6 : 1 },
                        shadowOpacity: selected ? 0.35 : 0.06,
                        shadowRadius: selected ? 10 : 4 }}>
                      <Ionicons name={item.icon} size={24}
                        color={selected ? item.color : T.textSub} />
                      <Text style={{ fontSize: 10, marginTop: 6, fontWeight: '700',
                        color: selected ? item.color : T.textMuted }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </FadeIn>

        {/* ── Mood tip ─────────────────────────────────────────────────── */}
        {selectedMood && (
          <FadeIn delay={0}>
            <View style={{ marginHorizontal: 24, marginTop: 16, borderRadius: 22,
              backgroundColor: T.bgCard, padding: 18, elevation: 2,
              shadowColor: T.shadow, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1, shadowRadius: 12 }}>
              <Text style={{ color: T.textSub, fontSize: 14, lineHeight: 22 }}>
                {MOOD_TIPS[selectedMood]}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
                {[
                  { label: 'Music',   icon: 'musical-notes-outline', screen: '/MusicScreen',   params: { mood: selectedMood }, color: '#1DB954' },
                  { label: 'Breathe', icon: 'pulse-outline',          screen: '/BreathingScreen', params: {},                  color: '#0891B2' },
                  { label: 'Talk',    icon: 'chatbubble-outline',     screen: '/AIChatScreen',  params: { mood: selectedMood }, color: T.primary },
                ].map(a => (
                  <TouchableOpacity key={a.label}
                    onPress={() => router.push({ pathname: a.screen, params: a.params })}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 14,
                      backgroundColor: a.color + '18', alignItems: 'center',
                      flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    <Ionicons name={a.icon} size={14} color={a.color} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: a.color }}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </FadeIn>
        )}

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <FadeIn delay={320}>
          <View style={{ marginHorizontal: 24, marginTop: 26, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 14 }}>
              Quick Actions
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                { icon: 'musical-notes-outline', label: 'Music',        gradient: ['#DB2777','#EC4899'], screen: '/MusicScreen' },
                { icon: 'pulse-outline',          label: 'Breathe',      gradient: ['#059669','#10B981'], screen: '/BreathingScreen' },
                { icon: 'chatbubble-outline',     label: 'Talk to Ease', gradient: ['#6D28D9','#7C3AED'], screen: '/AIChatScreen' },
                { icon: 'camera-outline',         label: 'Scan Emotion', gradient: ['#7C3AED','#A855F7'], screen: '/EmotionScreen' },
              ].map((a, idx) => (
                <FadeIn key={a.label} delay={360 + idx * 60} style={{ width: (width - 48 - 12) / 2 }}>
                  <TouchableOpacity onPress={() => router.push(a.screen)}
                    style={{ borderRadius: 22, overflow: 'hidden', elevation: 4,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15, shadowRadius: 8 }}
                    activeOpacity={0.85}>
                    <LinearGradient colors={a.gradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ padding: 20 }}>
                      <Ionicons name={a.icon} size={26} color="white" />
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14, marginTop: 12 }}>
                        {a.label}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </FadeIn>
              ))}
            </View>
          </View>
        </FadeIn>

      </ScrollView>

      {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: T.bgNav, borderTopWidth: 1, borderTopColor: T.border,
        paddingVertical: 12, paddingBottom: 16 }}>
        {[
          { icon: 'home',          label: 'Home',    screen: null },
          { icon: 'book-outline',  label: 'Journal', screen: '/JournalScreen' },
          { icon: 'camera-outline',label: '',        screen: '/EmotionScreen', fab: true },
          { icon: 'time-outline',  label: 'History', screen: '/MoodStats' },
          { icon: 'person-outline',label: 'Profile', screen: '/Profile' },
        ].map((tab, i) => tab.fab ? (
          <TouchableOpacity key={i} onPress={() => router.push(tab.screen)}
            style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: T.primary,
              alignItems: 'center', justifyContent: 'center', marginTop: -28,
              shadowColor: T.primary, shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45, shadowRadius: 14, elevation: 12 }}>
            <Ionicons name={tab.icon} size={26} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={i} onPress={() => tab.screen && router.push(tab.screen)}
            style={{ alignItems: 'center', paddingHorizontal: 8 }}>
            <Ionicons name={tab.icon} size={22} color={!tab.screen ? T.primary : T.textMuted} />
            {tab.label ? (
              <Text style={{ fontSize: 10, marginTop: 3, fontWeight: '600',
                color: !tab.screen ? T.primary : T.textMuted }}>{tab.label}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
