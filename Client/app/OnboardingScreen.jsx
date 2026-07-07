import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

function LogoMark({ size = 42 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="olg" cx="50%" cy="42%" r="52%">
          <Stop offset="0%" stopColor="#C084FC"/>
          <Stop offset="45%" stopColor="#9333EA"/>
          <Stop offset="100%" stopColor="#5B21B6"/>
        </RadialGradient>
      </Defs>
      <Circle cx="100" cy="100" r="92" fill="url(#olg)"/>
      <Path d="M100 42 C85 42 71 49 64 60 C57 71 56 84 59 94 C52 100 48 110 49 120 C50 130 59 138 69 140 C67 148 69 157 77 162 C85 167 95 166 100 159 L100 42 Z" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <Path d="M100 42 C115 42 129 49 136 60 C143 71 144 84 141 94 C148 100 152 110 151 120 C150 130 141 138 131 140 C133 148 131 157 123 162 C115 167 105 166 100 159 L100 42 Z" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <Path d="M74 158 L84 158 L88 148 L94 168 L98 152 L100 158 L126 158" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    </Svg>
  );
}

const SLIDES = [
  {
    lottie: require('../assets/images/onboarding1.json'),
    title: 'Your mind deserves care',
    subtitle: 'MindEase is a quiet, private space built for your emotional wellbeing. No judgement. No pressure. Just you.',
    icon: 'heart-outline',
    gradient: ['#1A0A3C', '#2D1060'],
    accent: '#C084FC',
  },
  {
    lottie: require('../assets/images/onboarding2.json'),
    title: 'Understand how you feel',
    subtitle: 'Write in your journal, scan your face with AI, or simply log your mood. Every entry helps you know yourself better.',
    icon: 'bulb-outline',
    gradient: ['#0C1A3C', '#0F2D60'],
    accent: '#60A5FA',
  },
  {
    lottie: require('../assets/images/onboarding3.json'),
    title: 'You are not alone in this',
    subtitle: 'Ease, your AI companion, is always ready to listen. Music, breathing exercises, and daily reflections are here whenever you need them.',
    icon: 'chatbubble-outline',
    gradient: ['#0A2810', '#1A4020'],
    accent: '#34D399',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = React.useState(0);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slide = SLIDES[current];

  const goNext = async () => {
    if (current < SLIDES.length - 1) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -40, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setCurrent(c => c + 1);
        slideAnim.setValue(40);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        ]).start();
      });
    } else {
      await AsyncStorage.setItem('seenOnboarding', 'true');
      router.replace('/Signup');
    }
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={slide.gradient}
        style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Top bar with logo + step dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center',
                justifyContent: 'center' }}>
                <LogoMark size={28} />
              </View>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 15,
                letterSpacing: 0.5 }}>MindEase</Text>
            </View>

            {/* Step dots */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {SLIDES.map((_, i) => (
                <View key={i} style={{
                  height: 6,
                  width: i === current ? 22 : 6,
                  borderRadius: 3,
                  backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.3)',
                }} />
              ))}
            </View>
          </View>

          {/* Lottie illustration */}
          <View style={{ alignItems: 'center', paddingTop: 28 }}>
            <LottieView source={slide.lottie}
              autoPlay loop
              style={{ width: width * 0.78, height: height * 0.36 }} />
          </View>

          {/* Content */}
          <Animated.View style={{
            flex: 1, paddingHorizontal: 28, paddingTop: 8,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
            {/* Icon badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center',
              marginBottom: 18, gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center',
                justifyContent: 'center' }}>
                <Ionicons name={slide.icon} size={18} color={slide.accent} />
              </View>
              <View style={{ height: 1, flex: 1,
                backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </View>

            <Text style={{ fontSize: 30, fontWeight: '800', color: 'white',
              lineHeight: 38, marginBottom: 14 }}>
              {slide.title}
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)',
              lineHeight: 24 }}>
              {slide.subtitle}
            </Text>
          </Animated.View>

          {/* Bottom CTA */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 36 }}>
            <TouchableOpacity onPress={goNext}
              style={{ borderRadius: 20, overflow: 'hidden', elevation: 6,
                shadowColor: slide.accent, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 12 }}>
              <View style={{
                backgroundColor: isLast ? '#7C3AED' : 'rgba(255,255,255,0.14)',
                padding: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 20,
                borderWidth: isLast ? 0 : 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                  {isLast ? 'Create Your Account' : 'Continue'}
                </Text>
                <Ionicons name={isLast ? 'arrow-forward' : 'chevron-forward'}
                  size={18} color="white" />
              </View>
            </TouchableOpacity>

            {!isLast && (
              <TouchableOpacity onPress={goNext}
                style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13,
                  fontWeight: '500' }}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
