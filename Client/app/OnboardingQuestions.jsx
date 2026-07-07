import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streakAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const REASONS = [
  { key: 'stress',   label: 'Manage stress',      icon: 'thunderstorm-outline', color: '#EF4444' },
  { key: 'anxiety',  label: 'Reduce anxiety',      icon: 'pulse-outline',        color: '#F59E0B' },
  { key: 'mood',     label: 'Track my mood',       icon: 'stats-chart-outline',  color: '#7C3AED' },
  { key: 'sleep',    label: 'Sleep better',        icon: 'moon-outline',         color: '#3B82F6' },
  { key: 'growth',   label: 'Personal growth',     icon: 'trending-up-outline',  color: '#059669' },
  { key: 'curious',  label: 'Just exploring',      icon: 'search-outline',       color: '#8B5CF6' },
];

const STRESS_LEVELS = [
  { key: 'low',    label: 'Low',    desc: 'I rarely feel overwhelmed',    color: '#D1FAE5', text: '#065F46', icon: 'sunny-outline' },
  { key: 'medium', label: 'Medium', desc: 'I sometimes struggle',         color: '#FEF3C7', text: '#92400E', icon: 'partly-sunny-outline' },
  { key: 'high',   label: 'High',   desc: 'Stress is a daily challenge',  color: '#FEE2E2', text: '#991B1B', icon: 'rainy-outline' },
];

const GOALS = [
  { key: 'journal_daily',  label: 'Journal every day',      icon: 'book-outline',         color: '#0891B2' },
  { key: 'track_mood',     label: 'Understand my emotions', icon: 'heart-outline',         color: '#7C3AED' },
  { key: 'reduce_stress',  label: 'Reduce my stress',       icon: 'leaf-outline',          color: '#059669' },
  { key: 'feel_happier',   label: 'Feel happier overall',   icon: 'sunny-outline',         color: '#F59E0B' },
];

const STEPS = [
  { title: "What brings you\nto MindEase?",       sub: 'Select the one that fits best.' },
  { title: "How would you\ndescribe your stress?", sub: 'Be honest — this helps us support you better.' },
  { title: "What is your\nmain goal?",             sub: 'We will personalise your experience around this.' },
];

export default function OnboardingQuestions() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();

  const [step, setStep] = useState(0);
  const [reason, setReason] = useState('');
  const [stressLevel, setStressLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const canContinue = [!!reason, !!stressLevel, !!goal][step];

  const animateStep = (dir, cb) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideAnim.setValue(dir * 30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < 2) animateStep(1, () => setStep(s => s + 1));
    else handleFinish();
  };

  const handleBack = () => {
    if (step > 0) animateStep(-1, () => setStep(s => s - 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    await streakAPI.saveOnboarding(reason, stressLevel, goal);
    await AsyncStorage.setItem('onboardingDone', 'true');
    setLoading(false);
    router.replace('/HomeScreen');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 20 }}>
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={T.text} />
            </TouchableOpacity>
          ) : <View style={{ width: 30 }} />}
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.textMuted,
            letterSpacing: 2 }}>{step + 1} OF 3</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: T.bgMuted, borderRadius: 4 }}>
          <Animated.View style={{
            height: 4, borderRadius: 4, backgroundColor: T.primary,
            width: `${((step + 1) / 3) * 100}%`,
          }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24,
        paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Step title */}
          <Text style={{ fontSize: 28, fontWeight: '800', color: T.text,
            lineHeight: 36, marginBottom: 6 }}>
            {STEPS[step].title}
          </Text>
          <Text style={{ fontSize: 14, color: T.textSub, marginBottom: 28 }}>
            {STEPS[step].sub}
          </Text>

          {/* Step 0: Reason */}
          {step === 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {REASONS.map(r => {
                const selected = reason === r.key;
                return (
                  <TouchableOpacity key={r.key} onPress={() => setReason(r.key)}
                    style={{ width: '47%', borderRadius: 20, padding: 18,
                      backgroundColor: selected ? r.color + '18' : T.bgCard,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? r.color : T.border,
                      elevation: selected ? 4 : 1 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12,
                      backgroundColor: selected ? r.color + '22' : T.bgMuted,
                      alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Ionicons name={r.icon} size={20}
                        color={selected ? r.color : T.textSub} />
                    </View>
                    <Text style={{ fontWeight: '700', fontSize: 14,
                      color: selected ? r.color : T.text }}>{r.label}</Text>
                    {selected && (
                      <View style={{ position: 'absolute', top: 12, right: 12 }}>
                        <Ionicons name="checkmark-circle" size={18} color={r.color} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Step 1: Stress level */}
          {step === 1 && STRESS_LEVELS.map(s => {
            const selected = stressLevel === s.key;
            return (
              <TouchableOpacity key={s.key} onPress={() => setStressLevel(s.key)}
                style={{ borderRadius: 20, padding: 20, marginBottom: 14,
                  backgroundColor: selected ? s.color : T.bgCard,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? s.text + '40' : T.border,
                  flexDirection: 'row', alignItems: 'center',
                  elevation: selected ? 4 : 1 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14,
                  backgroundColor: selected ? 'rgba(0,0,0,0.08)' : T.bgMuted,
                  alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name={s.icon} size={24}
                    color={selected ? s.text : T.textSub} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 16,
                    color: selected ? s.text : T.text }}>{s.label}</Text>
                  <Text style={{ fontSize: 13, marginTop: 2,
                    color: selected ? s.text + 'CC' : T.textSub }}>{s.desc}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={s.text} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Step 2: Goal */}
          {step === 2 && GOALS.map(g => {
            const selected = goal === g.key;
            return (
              <TouchableOpacity key={g.key} onPress={() => setGoal(g.key)}
                style={{ borderRadius: 20, padding: 20, marginBottom: 14,
                  backgroundColor: selected ? g.color + '14' : T.bgCard,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? g.color : T.border,
                  flexDirection: 'row', alignItems: 'center',
                  elevation: selected ? 4 : 1 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14,
                  backgroundColor: selected ? g.color + '20' : T.bgMuted,
                  alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name={g.icon} size={24}
                    color={selected ? g.color : T.textSub} />
                </View>
                <Text style={{ flex: 1, fontWeight: '700', fontSize: 15,
                  color: selected ? g.color : T.text }}>{g.label}</Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={g.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <TouchableOpacity onPress={handleNext}
          disabled={!canContinue || loading}
          style={{ borderRadius: 18, overflow: 'hidden', elevation: canContinue ? 6 : 1,
            shadowColor: T.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4, shadowRadius: 12 }}>
          <LinearGradient
            colors={canContinue ? ['#5B21B6', '#7C3AED', '#A855F7'] : [T.bgMuted, T.bgMuted]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ padding: 18, alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8 }}>
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Text style={{ color: canContinue ? 'white' : T.textMuted,
                  fontWeight: '800', fontSize: 16 }}>
                  {step === 2 ? 'Get Started' : 'Continue'}
                </Text>
                {!loading && (
                  <Ionicons name={step === 2 ? 'rocket-outline' : 'arrow-forward'}
                    size={18} color={canContinue ? 'white' : T.textMuted} />
                )}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
