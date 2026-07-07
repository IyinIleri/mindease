import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

export default function Profile() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const { user, userId, logout } = useAuth();
  const { theme: T, isDark, toggleDark } = useTheme();
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleLogout = () => {
    const { Alert } = require('react-native');
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout(); router.replace('/Login');
      }},
    ]);
  };

  const handleSendVerify = async () => {
    setVerifyLoading(true);
    const res = await authAPI.sendVerifyOtp(userId);
    setVerifyLoading(false);
    if (res.success) { router.push('/VerifyEmail'); }
    else { const { Alert } = require('react-native'); Alert.alert('Error', res.message); }
  };

  const MenuItem = ({ icon, label, onPress, right, danger }) => (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.bgCard,
        borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 10,
        elevation: 1 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center', marginRight: 14,
        backgroundColor: danger ? '#FEE2E2' : T.primarySoft }}>
        <Ionicons name={icon} size={19} color={danger ? T.error : T.primary} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600',
        color: danger ? T.error : T.text }}>{label}</Text>
      {right || <Ionicons name="chevron-forward" size={16} color={T.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: T.border,
        backgroundColor: T.bgCard }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: T.text,
          textAlign: 'center' }}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Avatar card */}
        <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 6,
          shadowColor: T.primary, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25, shadowRadius: 16 }}>
          <LinearGradient colors={['#7C3AED', '#A855F7']}
            style={{ padding: 28, alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Text style={{ color: 'white', fontSize: 34, fontWeight: '800' }}>
                {user?.name ? user.name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>
              {user?.name || 'User'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              {user?.isAccountVerified
                ? <><Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginLeft: 4 }}>Verified</Text></>
                : <><Ionicons name="alert-circle" size={14} color="#FCD34D" />
                    <Text style={{ color: '#FCD34D', fontSize: 12, marginLeft: 4 }}>Email not verified</Text></>
              }
            </View>
          </LinearGradient>
        </View>

        {/* Verify banner */}
        {!user?.isAccountVerified && (
          <TouchableOpacity onPress={handleSendVerify} disabled={verifyLoading}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED',
              borderWidth: 1, borderColor: '#FED7AA', borderRadius: 18,
              padding: 16, marginBottom: 20 }}>
            {verifyLoading ? <ActivityIndicator size="small" color="#F97316" />
              : <Ionicons name="mail-outline" size={20} color="#F97316" />}
            <Text style={{ color: '#C2410C', fontWeight: '600', marginLeft: 10, flex: 1 }}>
              Tap to verify your email
            </Text>
          </TouchableOpacity>
        )}

        {/* Activity section */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: T.textMuted,
          letterSpacing: 1, marginBottom: 10, marginLeft: 4 }}>ACTIVITY</Text>
        <MenuItem icon="book-outline" label="My Journal" onPress={() => router.push('/JournalScreen')} />
        <MenuItem icon="stats-chart-outline" label="Mood Stats" onPress={() => router.push('/MoodStats')} />
        <MenuItem icon="pulse-outline" label="Breathing Exercises" onPress={() => router.push('/BreathingScreen')} />
        <MenuItem icon="musical-notes-outline" label="Music" onPress={() => router.push('/MusicScreen')} />
        <MenuItem icon="chatbubble-outline" label="Talk to Ease" onPress={() => router.push('/AIChatScreen')} />

        {/* Preferences */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: T.textMuted,
          letterSpacing: 1, marginBottom: 10, marginTop: 8, marginLeft: 4 }}>PREFERENCES</Text>

        {/* Dark mode toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.bgCard,
          borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 10,
          elevation: 1 }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center',
            justifyContent: 'center', marginRight: 14, backgroundColor: isDark ? '#2D2848' : '#EDE9FE' }}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={19} color={T.primary} />
          </View>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: T.text }}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleDark}
            trackColor={{ false: T.border, true: T.primary }}
            thumbColor="white"
          />
        </View>

        <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => router.push('/ForgotPassword')} />

        <View style={{ marginTop: 8 }}>
          <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger
            right={<View />} />
        </View>

        <Text style={{ textAlign: 'center', color: T.textMuted, fontSize: 11,
          marginTop: 24, fontWeight: '500' }}>MindEase v1.0.0 · Made with </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
