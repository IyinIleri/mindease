import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { aiAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';

// ── Animated typing dots ──────────────────────────────────────────────────────
function TypingDots({ color }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 340, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 340, useNativeDriver: true }),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 5 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: color,
          opacity: dot,
          transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
        }} />
      ))}
    </View>
  );
}

const QUICK_PROMPTS = [
  "I have been feeling overwhelmed lately",
  "I am struggling to sleep",
  "I had a really good day today",
  "I feel anxious and I do not know why",
  "I need to talk about something",
  "Work has been really stressful",
];

export default function AIChatScreen() {
  const router = useRouter();
  const { mood = 'neutral' } = useLocalSearchParams();
  const { theme: T, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey, I am glad you are here. I am Ease. I am not going to give you a list of advice or tell you what to do. I just want to hear how you are really doing. What is on your mind?",
      time: dayjs().format('h:mm A'),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages, loading]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    setInput('');
    setShowPrompts(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg = { role: 'user', content: text, time: dayjs().format('h:mm A') };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const contextMessages = updated.slice(-14).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiAPI.chat(contextMessages, mood);

      if (!res.success) {
        showToast('Connection issue. Please try again.', 'error');
        setLoading(false);
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply,
        time: dayjs().format('h:mm A'),
      }]);
    } catch {
      showToast('Something went wrong. Try again.', 'error');
    }

    setLoading(false);
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Let us start fresh. What would you like to talk about?",
      time: dayjs().format('h:mm A'),
    }]);
    setShowPrompts(true);
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    return (
      <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
        {/* Timestamp every 6 messages or on first */}
        {(index === 0 || index % 8 === 0) && (
          <Text style={{ textAlign: 'center', color: T.textMuted, fontSize: 11,
            marginBottom: 10, fontWeight: '500' }}>{item.time}</Text>
        )}

        <View style={{ flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end' }}>

          {/* Ease avatar */}
          {!isUser && (
            <View style={{ width: 34, height: 34, borderRadius: 17,
              backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
              marginRight: 8, marginBottom: 2,
              shadowColor: T.primary, shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>E</Text>
            </View>
          )}

          {/* Message bubble */}
          <View style={{
            maxWidth: '76%',
            borderRadius: 22,
            borderBottomRightRadius: isUser ? 4 : 22,
            borderBottomLeftRadius: isUser ? 22 : 4,
            overflow: 'hidden',
          }}>
            {isUser ? (
              <LinearGradient colors={['#7C3AED', '#A855F7']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
                <Text style={{ color: 'white', fontSize: 15, lineHeight: 23 }}>
                  {item.content}
                </Text>
              </LinearGradient>
            ) : (
              <View style={{ backgroundColor: T.bgCard, paddingHorizontal: 16,
                paddingVertical: 13, elevation: 1,
                shadowColor: T.shadow, shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1, shadowRadius: 6 }}>
                <Text style={{ color: T.text, fontSize: 15, lineHeight: 24 }}>
                  {item.content}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      {/* Header */}
      <View style={{ backgroundColor: T.bgCard, borderBottomWidth: 1,
        borderBottomColor: T.border, paddingHorizontal: 16,
        paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>

        <View style={{ width: 42, height: 42, borderRadius: 21,
          backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
          marginRight: 12, shadowColor: T.primary, shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>E</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: T.text, fontSize: 17 }}>Ease</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5,
              backgroundColor: '#10B981', marginRight: 5 }} />
            <Text style={{ color: T.textMuted, fontSize: 12 }}>Your wellness companion</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleClearChat} style={{ padding: 8 }}>
          <Ionicons name="refresh-outline" size={20} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>

        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Typing indicator */}
        {loading && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end',
            paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17,
              backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
              marginRight: 8 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>E</Text>
            </View>
            <View style={{ backgroundColor: T.bgCard, borderRadius: 22,
              borderBottomLeftRadius: 4, paddingHorizontal: 18, paddingVertical: 13,
              elevation: 1 }}>
              <TypingDots color={T.primary} />
            </View>
          </View>
        )}

        {/* Quick prompt suggestions */}
        {showPrompts && !loading && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
            <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '700',
              marginBottom: 8, letterSpacing: 0.8 }}>START WITH</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <TouchableOpacity key={i} onPress={() => sendMessage(p)}
                    style={{ backgroundColor: T.bgCard, borderRadius: 20,
                      paddingHorizontal: 14, paddingVertical: 10,
                      borderWidth: 1, borderColor: T.border, maxWidth: 220 }}>
                    <Text style={{ color: T.textSub, fontSize: 13, fontWeight: '500' }}
                      numberOfLines={1}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input bar */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end',
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: T.bgCard, borderTopWidth: 1, borderTopColor: T.border, gap: 10 }}>
          <TextInput
            ref={inputRef}
            style={{ flex: 1, backgroundColor: T.bgInput, borderRadius: 24,
              paddingHorizontal: 18, paddingVertical: 12, fontSize: 15,
              color: T.text, maxHeight: 120, lineHeight: 22,
              borderWidth: 1, borderColor: T.border }}
            placeholder="Say anything..."
            placeholderTextColor={T.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{ width: 48, height: 48, borderRadius: 24,
              backgroundColor: input.trim() && !loading ? T.primary : T.bgMuted,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: input.trim() ? T.primary : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }}>
            <Ionicons name="send" size={20}
              color={input.trim() && !loading ? 'white' : T.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
