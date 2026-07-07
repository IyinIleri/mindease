import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.44, 190); // balanced circle size

export default function SplashScreen({ onFinish }) {
  const orbScale    = useRef(new Animated.Value(0.65)).current;
  const orbOpacity  = useRef(new Animated.Value(0)).current;
  const glowRadius  = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(24)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const lineWidth   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(orbScale,   { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(orbOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]),
      Animated.timing(lineWidth, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(textY,       { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.delay(950),
    ]).start(() => onFinish && onFinish());
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#1A0A3C',
      alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A3C" />

      {/* Ambient glow behind orb */}
      <Animated.View style={{
        position: 'absolute',
        width: CIRCLE_SIZE * 2,
        height: CIRCLE_SIZE * 2,
        borderRadius: CIRCLE_SIZE,
        backgroundColor: 'rgba(124,58,237,0.14)',
        transform: [{ scale: glowRadius }],
      }} />

      {/* The orb — perfect circle */}
      <Animated.View style={{
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        overflow: 'hidden',
        transform: [{ scale: orbScale }],
        opacity: orbOpacity,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 36,
        elevation: 20,
      }}>
        <LinearGradient
          colors={['#C084FC', '#9333EA', '#5B21B6']}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            alignItems: 'center', justifyContent: 'center' }}>
          {/* Brain SVG scaled to fit */}
          <Svg width={CIRCLE_SIZE * 0.6} height={CIRCLE_SIZE * 0.6}
               viewBox="0 0 120 120">
            <Defs>
              <RadialGradient id="sh" cx="38%" cy="30%" r="50%">
                <Stop offset="0%"   stopColor="#EDE9FE" stopOpacity="0.35"/>
                <Stop offset="100%" stopColor="#EDE9FE" stopOpacity="0"/>
              </RadialGradient>
            </Defs>
            {/* Shine overlay */}
            <Circle cx="60" cy="60" r="56" fill="url(#sh)"/>
            {/* Left hemisphere */}
            <Path d="M60 18 C47 18 35 24 29 34 C23 44 22.5 56 25 65 C19 70 15 79 16 88 C17 97 25 104 34 106 C32 113 34 121 41 125 C48 129 57 128 60 122 L60 18 Z"
              fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
            {/* Right hemisphere */}
            <Path d="M60 18 C73 18 85 24 91 34 C97 44 97.5 56 95 65 C101 70 105 79 104 88 C103 97 95 104 86 106 C88 113 86 121 79 125 C72 129 63 128 60 122 L60 18 Z"
              fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
            <Line x1="60" y1="18" x2="60" y2="122" stroke="white" strokeWidth="2"
              opacity="0.22" strokeDasharray="5,5"/>
            {/* Left folds */}
            <Path d="M38 36 C34 44 33 54 36 61" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
            <Path d="M20 70 C20 82 25 92 31 98" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
            {/* Right folds */}
            <Path d="M82 36 C86 44 87 54 84 61" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
            <Path d="M100 70 C100 82 95 92 89 98" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
            {/* Heartbeat line */}
            <Path d="M38 120 L46 120 L50 111 L55 130 L59 116 L60 120 L82 120"
              fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.88"/>
          </Svg>
        </LinearGradient>
      </Animated.View>

      {/* Thin separator line */}
      <Animated.View style={{
        height: 1, backgroundColor: '#A78BFA',
        marginTop: 32, opacity: Animated.multiply(lineWidth, 0.3),
        transform: [{ scaleX: lineWidth }],
        width: 100,
      }} />

      {/* Wordmark */}
      <Animated.Text style={{
        color: 'white',
        fontSize: 38,
        fontWeight: '800',
        letterSpacing: 2.5,
        marginTop: 20,
        opacity: textOpacity,
        transform: [{ translateY: textY }],
        textShadowColor: '#9333EA',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
      }}>
        MindEase
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={{
        color: '#C084FC',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 4,
        marginTop: 8,
        opacity: tagOpacity,
      }}>
        YOUR WELLNESS COMPANION
      </Animated.Text>
    </View>
  );
}
