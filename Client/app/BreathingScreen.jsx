import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  Easing, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const EXERCISES = [
  {
    key: '478',
    name: '4-7-8 Breathing',
    desc: 'Calms anxiety and helps you sleep',
    icon: 'moon-outline',
    gradient: ['#7C3AED', '#A855F7'],
    phases: [
      { label: 'Inhale',  duration: 4, color: '#A78BFA' },
      { label: 'Hold',    duration: 7, color: '#7C3AED' },
      { label: 'Exhale',  duration: 8, color: '#4C1D95' },
    ],
  },
  {
    key: 'box',
    name: 'Box Breathing',
    desc: 'Builds focus and reduces stress',
    icon: 'square-outline',
    gradient: ['#0891B2', '#06B6D4'],
    phases: [
      { label: 'Inhale',  duration: 4, color: '#22D3EE' },
      { label: 'Hold',    duration: 4, color: '#0891B2' },
      { label: 'Exhale',  duration: 4, color: '#164E63' },
      { label: 'Hold',    duration: 4, color: '#0891B2' },
    ],
  },
  {
    key: 'calm',
    name: 'Calm Breath',
    desc: 'Simple, steady, and relaxing',
    icon: 'leaf-outline',
    gradient: ['#059669', '#10B981'],
    phases: [
      { label: 'Inhale',  duration: 5, color: '#34D399' },
      { label: 'Exhale',  duration: 5, color: '#059669' },
    ],
  },
];

export default function BreathingScreen() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();

  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  const timerRef = useRef(null);
  const animRef = useRef(null);

  const exercise = EXERCISES.find(e => e.key === selected);

  const stopAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animRef.current) animRef.current.stop();
    setRunning(false);
    setPhaseIndex(0);
    setCountdown(0);
    setCycles(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.7, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const runPhase = (ex, idx, onDone) => {
    const phase = ex.phases[idx];
    setPhaseIndex(idx);
    setCountdown(phase.duration);

    if (animRef.current) animRef.current.stop();

    const toScale = phase.label === 'Inhale' ? 1.45 : phase.label === 'Exhale' ? 0.8 : scaleAnim._value;
    const toOpacity = phase.label === 'Inhale' ? 1 : phase.label === 'Exhale' ? 0.6 : 0.85;

    animRef.current = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: toScale, duration: phase.duration * 1000,
        easing: Easing.inOut(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: toOpacity, duration: phase.duration * 1000, useNativeDriver: true,
      }),
    ]);
    animRef.current.start();

    let remaining = phase.duration;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        onDone();
      }
    }, 1000);
  };

  const startExercise = () => {
    if (!exercise) return;
    setRunning(true);
    setCycles(0);
    let currentPhase = 0;
    let currentCycles = 0;

    const next = () => {
      if (currentPhase >= exercise.phases.length) {
        currentPhase = 0;
        currentCycles += 1;
        setCycles(currentCycles);
      }
      runPhase(exercise, currentPhase, () => {
        currentPhase += 1;
        next();
      });
    };
    next();
  };

  useEffect(() => { return () => stopAll(); }, []);

  const currentPhase = exercise?.phases[phaseIndex];
  const phaseInstruction = {
    Inhale: 'Breathe in slowly through your nose',
    Hold:   'Hold gently. Stay still.',
    Exhale: 'Breathe out slowly through your mouth',
  }[currentPhase?.label] || '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: T.border,
        backgroundColor: T.bgCard }}>
        <TouchableOpacity onPress={() => { stopAll(); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: T.text,
          textAlign: 'center' }}>Breathing Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      {!running ? (
        /* ── Select exercise ──────────────────────────────────────────── */
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ color: T.textSub, fontSize: 14, marginBottom: 24, lineHeight: 22 }}>
            Choose a breathing technique. Even two minutes can shift how you feel.
          </Text>

          {EXERCISES.map(ex => (
            <TouchableOpacity key={ex.key} onPress={() => setSelected(ex.key)}
              style={{ borderRadius: 24, marginBottom: 16, overflow: 'hidden',
                elevation: selected === ex.key ? 6 : 2,
                shadowColor: selected === ex.key ? ex.gradient[0] : T.shadow,
                shadowOffset: { width: 0, height: selected === ex.key ? 6 : 2 },
                shadowOpacity: selected === ex.key ? 0.3 : 0.08,
                shadowRadius: selected === ex.key ? 12 : 6 }}>
              {selected === ex.key ? (
                <LinearGradient colors={ex.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 22 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name={ex.icon} size={26} color="white" />
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 17,
                      marginLeft: 12 }}>{ex.name}</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{ex.desc}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
                    {ex.phases.map((p, i) => (
                      <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4,
                        borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                          {p.label} {p.duration}s
                        </Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              ) : (
                <View style={{ backgroundColor: T.bgCard, padding: 22 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12,
                      backgroundColor: T.primarySoft, alignItems: 'center',
                      justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name={ex.icon} size={22} color={T.primary} />
                    </View>
                    <Text style={{ fontWeight: '800', color: T.text, fontSize: 16 }}>{ex.name}</Text>
                  </View>
                  <Text style={{ color: T.textSub, fontSize: 13 }}>{ex.desc}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 }}>
                    {ex.phases.map((p, i) => (
                      <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4,
                        borderRadius: 10, backgroundColor: T.bgMuted }}>
                        <Text style={{ color: T.textSub, fontSize: 12, fontWeight: '600' }}>
                          {p.label} {p.duration}s
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={startExercise} disabled={!selected}
            style={{ borderRadius: 20, overflow: 'hidden', marginTop: 8,
              elevation: selected ? 6 : 1,
              shadowColor: selected ? T.primary : 'transparent',
              shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 }}>
            <LinearGradient
              colors={selected ? (EXERCISES.find(e => e.key === selected)?.gradient || [T.primary, T.accent]) : [T.bgMuted, T.bgMuted]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: 'center', flexDirection: 'row',
                justifyContent: 'center', gap: 10 }}>
              <Ionicons name="pulse-outline" size={22} color={selected ? 'white' : T.textMuted} />
              <Text style={{ fontWeight: '800', fontSize: 17,
                color: selected ? 'white' : T.textMuted }}>
                Start Breathing
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* ── Active session ───────────────────────────────────────────── */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
          backgroundColor: T.bg, paddingHorizontal: 32 }}>

          <Text style={{ color: T.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>
            CYCLE {cycles + 1}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: T.text, marginBottom: 48 }}>
            {currentPhase?.label || ''}
          </Text>

          {/* Animated breathing circle */}
          <Animated.View style={{
            width: 200, height: 200, borderRadius: 100,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: currentPhase?.color || T.primary,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            shadowColor: currentPhase?.color || T.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 40,
            elevation: 16,
          }}>
            <Text style={{ color: 'white', fontSize: 56, fontWeight: '800' }}>{countdown}</Text>
          </Animated.View>

          <Text style={{ color: T.textSub, fontSize: 15, marginTop: 48,
            textAlign: 'center', lineHeight: 24 }}>
            {phaseInstruction}
          </Text>

          <TouchableOpacity onPress={stopAll}
            style={{ marginTop: 48, paddingHorizontal: 32, paddingVertical: 14,
              borderRadius: 18, backgroundColor: isDark ? '#2D1010' : '#FEE2E2',
              borderWidth: 1, borderColor: T.error }}>
            <Text style={{ color: T.error, fontWeight: '700', fontSize: 15 }}>Stop Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
