import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const PRIMARY_HEX = '#7C3AED';

export default function VerifyEmail() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const { userId, setUser } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    const res = await authAPI.verifyEmail(userId, otp);
    setLoading(false);
    if (res.success) {
      setUser(prev => ({ ...prev, isAccountVerified: true }));
      Alert.alert('Verified ', 'Your email has been verified!', [
        { text: 'OK', onPress: () => router.replace('/HomeScreen') },
      ]);
    } else {
      Alert.alert('Error', res.message || 'Invalid or expired OTP.');
    }
  };

  return (
    <SafeAreaView className="flex-1  px-6">
      <View className="flex-row items-center pt-4 pb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-4">Verify Email</Text>
      </View>

      <View className="items-center mb-10">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: '#EDE9FE' }}>
          <Ionicons name="mail-open-outline" size={40} color={PRIMARY_HEX} />
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center">Check Your Email</Text>
        <Text className="text-gray-500 text-center mt-2">
          We sent a 6-digit code to your email. Enter it below.
        </Text>
      </View>

      <Text className="font-medium mb-2 text-gray-800">Verification Code</Text>
      <View className="flex-row items-center bg-white rounded-xl h-16 px-5 mb-8 border border-gray-100"
        style={{ elevation: 2 }}>
        <Ionicons name="key-outline" size={22} color={PRIMARY_HEX} />
        <TextInput
          className="flex-1 text-2xl ml-3 tracking-widest font-bold text-gray-800"
          placeholder="• • • • • •"
          placeholderTextColor="#A0AEC0"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity onPress={handleVerify} disabled={loading}
        style={{ backgroundColor: PRIMARY_HEX }}
        className="py-5 rounded-xl">
        {loading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white text-center font-bold text-xl">Verify Email</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
