import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Alert, Dimensions, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { aiAPI, moodAPI } from '../services/api';

const { width } = Dimensions.get('window');

const MOOD_COLORS = {
  happy: '#FDE68A', sad: '#BFDBFE', angry: '#FCA5A5',
  stressed: '#BBF7D0', neutral: '#E0E7FF',
};
const MOOD_EMOJI = {
  happy: '😊', sad: '😢', angry: '😡', stressed: '🧘', neutral: '😐',
};
const MOOD_MESSAGE = {
  happy:   "You're looking happy! Keep that energy going 🌟",
  sad:     "You seem a bit down. It's okay — let's help you feel better 💙",
  angry:   "You look tense or frustrated. Let's find something calming 🍃",
  stressed:"You seem stressed. Take a breath — we've got you 🧘",
  neutral: "You seem calm and composed right now 😌",
};

export default function EmotionScreen() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [stage, setStage] = useState('preview');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const handleScan = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true, quality: 0.4, exif: false,
      });

      // Send to backend → Groq vision
      const analysisRes = await aiAPI.analyzeEmotion(photo.base64);
      const detectedMood = analysisRes.success ? analysisRes.mood : 'neutral';
      const confidence = analysisRes.confidence || 0.75;

      // Save mood entry to history
      const saveRes = await moodAPI.save(detectedMood, detectedMood, '', confidence, '');

      setResult({
        mood: detectedMood,
        confidence,
        description: analysisRes.description || '',
        playlist: saveRes.playlist,
      });
      setStage('result');
    } catch {
      Alert.alert('Scan Failed', 'Could not analyse your face. Please try again.');
    }
    setScanning(false);
  };

  const handleWriteJournal = () => {
    //  Pass faceEmotion + confidence to JournalScreen
    router.push({
      pathname: '/JournalScreen',
      params: {
        faceEmotion: result.mood,
        faceConfidence: result.confidence,
        faceDescription: result.description,
      },
    });
  };

  // ── No permission ────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F7FF] items-center justify-center">
        <ActivityIndicator size="large" color={'#7C3AED'} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F7FF]">
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 ml-4">Emotion Scan</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 60 }} className="mb-6">📷</Text>
          <Text className="text-xl font-bold text-gray-800 text-center mb-3">Camera Permission Needed</Text>
          <Text className="text-gray-500 text-center mb-8">
            MindEase needs camera access to scan your face and detect your emotion.
          </Text>
          <TouchableOpacity onPress={requestPermission}
            className="py-4 px-8 rounded-2xl" style={{ backgroundColor: '#7C3AED' }}>
            <Text className="text-white font-bold text-lg">Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result screen ────────────────────────────────────────────────────────
  if (stage === 'result' && result) {
    const bgColor = MOOD_COLORS[result.mood] || '#E0E7FF';
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => { setStage('preview'); setResult(null); }}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 ml-4">Emotion Detected</Text>
        </View>

        <View className="flex-1 px-6 py-4">
          {/* Main mood card */}
          <View className="bg-white rounded-3xl p-6 items-center mb-4" style={{ elevation: 4 }}>
            <Text style={{ fontSize: 80 }}>{MOOD_EMOJI[result.mood]}</Text>
            <Text className="text-3xl font-extrabold text-gray-800 mt-3 capitalize">{result.mood}</Text>
            <Text className="text-gray-500 text-sm mt-1 text-center px-4">
              {result.description || MOOD_MESSAGE[result.mood]}
            </Text>
            {/* Confidence bar */}
            <View className="w-full mt-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-400">Detection confidence</Text>
                <Text className="text-xs font-bold" style={{ color: '#7C3AED' }}>
                  {Math.round(result.confidence * 100)}%
                </Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full">
                <View className="h-2 rounded-full" style={{
                  width: `${result.confidence * 100}%`,
                  backgroundColor: '#7C3AED',
                }} />
              </View>
            </View>
          </View>

          {/* What to do next */}
          <Text className="text-gray-600 font-semibold text-sm mb-3 px-1">What would you like to do?</Text>

          {/*  Write in journal — passes emotion over */}
          <TouchableOpacity onPress={handleWriteJournal}
            className="flex-row items-center bg-white rounded-2xl p-5 mb-3"
            style={{ elevation: 2 }}>
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: T.primarySoft }}>
              <Ionicons name="book-outline" size={24} color={'#7C3AED'} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-800 text-base">Write in Journal</Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                Your {result.mood} mood will be pre-loaded for deeper AI analysis
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Listen to music */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/MusicScreen', params: { mood: result.mood } })}
            className="flex-row items-center bg-white rounded-2xl p-5 mb-3"
            style={{ elevation: 2 }}>
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: '#D1FAE5' }}>
              <Ionicons name="musical-notes" size={24} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-800 text-base">Play Music for my Mood</Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                {result.playlist?.label || 'Curated playlist for you'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Scan again */}
          <TouchableOpacity onPress={() => { setStage('preview'); setResult(null); }}
            className="flex-row items-center bg-white rounded-2xl p-5"
            style={{ elevation: 2 }}>
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: '#FEF3C7' }}>
              <Ionicons name="refresh" size={24} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-800 text-base">Scan Again</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Take another photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera screen ────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
      <View style={StyleSheet.absoluteFill}>
        {/* Top bar */}
        <SafeAreaView>
          <View className="flex-row items-center px-5 pt-2">
            <TouchableOpacity onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg ml-4"
              style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
              Face Scan
            </Text>
          </View>
        </SafeAreaView>

        {/* Face oval guide */}
        <View className="flex-1 items-center justify-center">
          <View style={{
            width: width * 0.65, height: width * 0.82,
            borderRadius: width * 0.4,
            borderWidth: 3,
            borderColor: scanning ? T.success : 'rgba(255,255,255,0.85)',
            borderStyle: 'dashed',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {scanning && (
              <View className="items-center">
                <ActivityIndicator size="large" color="white" />
                <Text className="text-white font-semibold mt-3 text-base">Analysing...</Text>
              </View>
            )}
          </View>
          <Text className="text-white text-center mt-5 px-10 text-sm"
            style={{ textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
            {scanning ? 'AI is detecting your emotion...' : 'Look at the camera, then tap the button below'}
          </Text>
        </View>

        {/* Shutter button */}
        <View className="items-center pb-16">
          <TouchableOpacity onPress={handleScan} disabled={scanning}
            style={{
              width: 82, height: 82, borderRadius: 41,
              backgroundColor: scanning ? '#6B7280' : '#7C3AED',
              alignItems: 'center', justifyContent: 'center',
              elevation: 8, borderWidth: 4, borderColor: 'white',
            }}>
            {scanning
              ? <ActivityIndicator color="white" size="large" />
              : <Ionicons name="camera" size={38} color="white" />}
          </TouchableOpacity>
          <Text className="text-white mt-3 font-semibold"
            style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
            {scanning ? 'Scanning...' : 'Tap to Scan Face'}
          </Text>
        </View>
      </View>
    </View>
  );
}
