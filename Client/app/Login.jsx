import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';

function LogoMark({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="lg" cx="50%" cy="42%" r="52%">
          <Stop offset="0%" stopColor="#C084FC"/>
          <Stop offset="45%" stopColor="#9333EA"/>
          <Stop offset="100%" stopColor="#5B21B6"/>
        </RadialGradient>
      </Defs>
      <Circle cx="100" cy="100" r="92" fill="url(#lg)"/>
      <Path d="M100 42 C85 42 71 49 64 60 C57 71 56 84 59 94 C52 100 48 110 49 120 C50 130 59 138 69 140 C67 148 69 157 77 162 C85 167 95 166 100 159 L100 42 Z" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <Path d="M100 42 C115 42 129 49 136 60 C143 71 144 84 141 94 C148 100 152 110 151 120 C150 130 141 138 131 140 C133 148 131 157 123 162 C115 167 105 166 100 159 L100 42 Z" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <Line x1="100" y1="42" x2="100" y2="170" stroke="white" strokeWidth="2.5" opacity="0.22" strokeDasharray="6,6"/>
      <Path d="M74 162 L84 162 L88 151 L94 172 L98 155 L100 162 L126 162" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeIn    = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeIn,    { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { showToast('Please enter your email and password.'); return; }
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (res.success) {
      showToast('Welcome back!', 'success');
      setTimeout(() => router.replace('/HomeScreen'), 600);
    } else {
      showToast(res.message || 'Invalid email or password.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28,
          paddingTop: 52, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always">

        {/* Logo */}
        <Animated.View style={{ alignItems: 'center', marginBottom: 36,
          transform: [{ scale: logoScale }], opacity: fadeIn }}>
          <View style={{ width: 86, height: 86, borderRadius: 26,
            backgroundColor: '#12101E', alignItems: 'center', justifyContent: 'center',
            shadowColor: '#9333EA', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5, shadowRadius: 20, elevation: 12, marginBottom: 14 }}>
            <LogoMark size={70} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: 1,
            textShadowColor: '#7C3AED', textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 14 }}>MindEase</Text>
          <Text style={{ fontSize: 10, color: T.textMuted, letterSpacing: 3.5,
            marginTop: 3, fontWeight: '600' }}>YOUR WELLNESS COMPANION</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeIn }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: T.text, marginBottom: 4 }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 14, color: T.textSub, marginBottom: 28 }}>
            Log in to continue your journey.
          </Text>

          {/* Email */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: T.textSub,
            marginBottom: 8, letterSpacing: 0.5 }}>EMAIL ADDRESS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center',
            backgroundColor: T.bgCard, borderRadius: 16, height: 56,
            paddingHorizontal: 16, borderWidth: 1, borderColor: T.border,
            marginBottom: 18 }}>
            <Ionicons name="mail-outline" size={20} color={T.primary} />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: T.text, marginLeft: 12 }}
              placeholder="Enter your email"
              placeholderTextColor={T.textMuted}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
              autoCorrect={false} blurOnSubmit={false}
            />
          </View>

          {/* Password */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: T.textSub,
            marginBottom: 8, letterSpacing: 0.5 }}>PASSWORD</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center',
            backgroundColor: T.bgCard, borderRadius: 16, height: 56,
            paddingHorizontal: 16, borderWidth: 1, borderColor: T.border,
            marginBottom: 10 }}>
            <Ionicons name="lock-closed-outline" size={20} color={T.primary} />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: T.text, marginLeft: 12 }}
              placeholder="Enter your password"
              placeholderTextColor={T.textMuted}
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none" autoCorrect={false} blurOnSubmit={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20} color={T.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/ForgotPassword')}
            style={{ alignSelf: 'flex-end', marginBottom: 28 }}>
            <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13 }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={{ borderRadius: 18, overflow: 'hidden', elevation: 6,
              shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 12, marginBottom: 24 }}>
            <LinearGradient colors={['#5B21B6', '#7C3AED', '#A855F7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ padding: 17, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                    Log In
                  </Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: T.textSub, fontSize: 14 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/Signup')}>
              <Text style={{ color: T.primary, fontWeight: '800', fontSize: 14 }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
