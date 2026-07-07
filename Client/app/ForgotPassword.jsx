import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';

const PRIMARY_HEX = '#7C3AED';

export default function ForgotPassword() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  // Step 1: enter email → Step 2: enter OTP + new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }
    setLoading(true);
    const res = await authAPI.sendResetOtp(email.trim().toLowerCase());
    setLoading(false);
    if (res.success) {
      setStep(2);
    } else {
      Alert.alert('Error', res.message || 'Could not send OTP.');
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const res = await authAPI.resetPassword(email.trim().toLowerCase(), otp, newPassword);
    setLoading(false);
    if (res.success) {
      Alert.alert('Password Reset ', 'Your password has been reset successfully.', [
        { text: 'Login', onPress: () => router.replace('/Login') },
      ]);
    } else {
      Alert.alert('Error', res.message || 'Could not reset password.');
    }
  };

  return (
    <SafeAreaView className="flex-1 ">
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-4">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 30, paddingBottom: 40 }}>

        {step === 1 ? (
          <>
            <Text className="text-gray-500 text-base mb-8">
              Enter your email address and we'll send you a 6-digit OTP to reset your password.
            </Text>
            <Text className="font-medium mb-2 text-gray-800">Email Address</Text>
            <View className="flex-row items-center bg-white rounded-xl h-16 px-5 mb-8 border border-gray-100"
              style={{ elevation: 2 }}>
              <Ionicons name="mail-outline" size={22} color={PRIMARY_HEX} />
              <TextInput
                className="flex-1 text-base ml-3"
                placeholder="Enter your email"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={handleSendOtp} disabled={loading}
              style={{ backgroundColor: PRIMARY_HEX }}
              className="py-5 rounded-xl">
              {loading ? <ActivityIndicator color="white" /> : (
                <Text className="text-white text-center font-bold text-xl">Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8">
              <Text className="text-green-700 text-sm">
                 OTP sent to <Text className="font-bold">{email}</Text>. Check your inbox.
              </Text>
            </View>

            <Text className="font-medium mb-2 text-gray-800">OTP Code</Text>
            <View className="flex-row items-center bg-white rounded-xl h-16 px-5 mb-5 border border-gray-100"
              style={{ elevation: 2 }}>
              <Ionicons name="key-outline" size={22} color={PRIMARY_HEX} />
              <TextInput
                className="flex-1 text-base ml-3"
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#A0AEC0"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <Text className="font-medium mb-2 text-gray-800">New Password</Text>
            <View className="flex-row items-center bg-white rounded-xl h-16 px-5 mb-8 border border-gray-100"
              style={{ elevation: 2 }}>
              <Ionicons name="lock-closed-outline" size={22} color={PRIMARY_HEX} />
              <TextInput
                className="flex-1 text-base ml-3"
                placeholder="New password (min 8 chars)"
                placeholderTextColor="#A0AEC0"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleResetPassword} disabled={loading}
              style={{ backgroundColor: PRIMARY_HEX }}
              className="py-5 rounded-xl">
              {loading ? <ActivityIndicator color="white" /> : (
                <Text className="text-white text-center font-bold text-xl">Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} className="mt-4 items-center">
              <Text style={{ color: PRIMARY_HEX }} className="text-sm font-medium">Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
