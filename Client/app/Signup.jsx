import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StatusBar,
  Animated, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Defs, RadialGradient, Stop, ClipPath } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';

/* ---------------- LOGO ---------------- */
function LogoMark({ size = 72 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="og2" cx="50%" cy="42%" r="52%">
          <Stop offset="0%" stopColor="#C084FC"/>
          <Stop offset="45%" stopColor="#9333EA"/>
          <Stop offset="100%" stopColor="#6D28D9"/>
        </RadialGradient>
        <ClipPath id="oc2"><Circle cx="100" cy="100" r="88"/></ClipPath>
      </Defs>
      <Circle cx="100" cy="100" r="88" fill="url(#og2)"/>
      <Path d="M100 46 C86 46 73 52 67 62 C61 72 60.5 84 63 93 C57 98 53 107 54 116 C55 125 63 132 72 134 C70 141 72 149 79 153 C86 157 95 156 100 150 C105 156 114 157 121 153 C128 149 130 141 128 134 C137 132 145 125 146 116 C147 107 143 98 137 93 C139.5 84 139 72 133 62 C127 52 114 46 100 46 Z" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.88"/>
      <Line x1="100" y1="46" x2="100" y2="172" stroke="white" strokeWidth="2.5" opacity="0.25" strokeDasharray="6,6"/>
    </Svg>
  );
}

/* ---------------- FIELD (MEMOIZED) ---------------- */
const Field = memo(({ label, placeholder, value, onChange, icon, keyboard, secure, isPass, show, toggle, T }) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: T.textSub, marginBottom: 7 }}>{label}</Text>
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: T.bgCard, borderRadius: 16,
      height: 56, paddingHorizontal: 16,
      borderWidth: 1, borderColor: T.border
    }}>
      <Ionicons name={icon} size={20} color={T.primary} />
      <TextInput
        style={{ flex: 1, fontSize: 15, color: T.text, marginLeft: 12 }}
        placeholder={placeholder}
        placeholderTextColor={T.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        secureTextEntry={secure}
        autoCapitalize="none"
        blurOnSubmit={false}   // 🔥 prevents keyboard closing
      />
      {isPass && (
        <TouchableOpacity onPress={toggle}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={T.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  </View>
));

/* ---------------- MAIN ---------------- */
export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirm) { showToast('Please fill in all fields.'); return; }
    if (password !== confirm) { showToast('Passwords do not match.'); return; }
    if (password.length < 8) { showToast('Password must be at least 8 characters.'); return; }

    setLoading(true);
    const res = await register(name.trim(), email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      showToast('Account created!', 'success');
      setTimeout(() => router.replace('/OnboardingQuestions'), 700);
    } else {
      showToast(res.message || 'Something went wrong.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >

          {/* Logo */}
          <Animated.View style={{
            alignItems: 'center',
            marginBottom: 32,
            transform: [{ scale: logoScale }],
            opacity: fadeIn
          }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24,
              overflow: 'hidden', backgroundColor: '#1A0A3C',
              marginBottom: 14, alignItems: 'center', justifyContent: 'center'
            }}>
              <LogoMark size={66} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: T.text }}>
              MindEase
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: T.text, marginBottom: 4 }}>
              Create account
            </Text>

            <Field label="Full Name" placeholder="Your name" value={name} onChange={setName} icon="person-outline" T={T} />
            <Field label="Email Address" placeholder="Your email" value={email} onChange={setEmail} icon="mail-outline" keyboard="email-address" T={T} />
            <Field label="Password" placeholder="Min 8 characters" value={password} onChange={setPassword} icon="lock-closed-outline" secure={!showPw} isPass show={showPw} toggle={() => setShowPw(!showPw)} T={T} />
            <Field label="Confirm Password" placeholder="Re-enter password" value={confirm} onChange={setConfirm} icon="shield-checkmark-outline" secure={!showCf} isPass show={showCf} toggle={() => setShowCf(!showCf)} T={T} />

            <TouchableOpacity onPress={handleSignUp} disabled={loading} style={{ borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
              <LinearGradient colors={['#6D28D9', '#9333EA', '#C084FC']} style={{ padding: 18, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="white" /> :
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}