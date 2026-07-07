import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useTheme, moodColor } from '../context/ThemeContext';
import { moodAPI, streakAPI } from '../services/api';

const { width } = Dimensions.get('window');

// ── Mood config — Ionicons only, matching HomeScreen ─────────────────────────
const MOOD_ICON = {
  happy:    { icon: 'sunny-outline',         color: '#F59E0B', label: 'Happy'   },
  neutral:  { icon: 'ellipse-outline',        color: '#7C3AED', label: 'Calm'    },
  sad:      { icon: 'rainy-outline',           color: '#3B82F6', label: 'Sad'     },
  angry:    { icon: 'flame-outline',            color: '#EF4444', label: 'Angry'   },
  stressed: { icon: 'thunderstorm-outline',     color: '#059669', label: 'Stressed'},
};

const MOOD_ORDER = ['happy', 'neutral', 'sad', 'angry', 'stressed'];

// ── Small mood icon badge used in chart and list ──────────────────────────────
function MoodBadge({ mood, size = 22, bg = false, T }) {
  const cfg = MOOD_ICON[mood] || MOOD_ICON.neutral;
  if (bg) {
    return (
      <View style={{ width: size + 10, height: size + 10, borderRadius: (size + 10) / 2,
        backgroundColor: cfg.color + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={cfg.icon} size={size} color={cfg.color} />
      </View>
    );
  }
  return <Ionicons name={cfg.icon} size={size} color={cfg.color} />;
}

export default function MoodStats() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const [history, setHistory] = useState([]);
  const [streak,  setStreak]  = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const [moodRes, streakRes] = await Promise.all([
      moodAPI.history(),
      streakAPI.get(),
    ]);
    if (moodRes.success)   setHistory(moodRes.history);
    if (streakRes.success) setStreak(streakRes);
    setLoading(false);
  };

  const moodCounts = history.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});

  const total   = history.length;
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  // Last 7 days for weekly chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date    = dayjs().subtract(6 - i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const entries = history.filter(e =>
      dayjs(e.createdAt).format('YYYY-MM-DD') === dateStr
    );
    return {
      date:    dateStr,
      label:   date.format('ddd'),
      mood:    entries.length > 0 ? entries[0].mood : null,
      isToday: dateStr === dayjs().format('YYYY-MM-DD'),
    };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.bgCard }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '800',
          color: T.text, textAlign: 'center' }}>Mood Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>

          {/* ── Summary cards ──────────────────────────────────────────── */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {[
              {
                label: 'Total Entries',
                value: String(total),
                icon:  'book-outline',
                color: T.primary,
              },
              {
                label: 'Day Streak',
                value: String(streak?.currentStreak || 0),
                icon:  'flame-outline',
                color: '#F97316',
              },
              {
                label: 'Top Mood',
                // icon from MOOD_ICON instead of emoji
                value: topMood ? MOOD_ICON[topMood[0]]?.label || topMood[0] : '-',
                icon:  topMood ? MOOD_ICON[topMood[0]]?.icon || 'ellipse-outline' : 'ellipse-outline',
                color: topMood ? MOOD_ICON[topMood[0]]?.color || T.primary : T.primary,
              },
            ].map(card => (
              <View key={card.label}
                style={{ flex: 1, backgroundColor: T.bgCard, borderRadius: 20,
                  padding: 16, alignItems: 'center', elevation: 2,
                  shadowColor: T.shadow, shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1, shadowRadius: 8 }}>
                <Ionicons name={card.icon} size={22} color={card.color} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: T.text, marginTop: 8 }}>
                  {card.value}
                </Text>
                <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 2,
                  textAlign: 'center', fontWeight: '600' }}>
                  {card.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Weekly Chart ────────────────────────────────────────────── */}
          <View style={{ backgroundColor: T.bgCard, borderRadius: 24,
            padding: 20, marginBottom: 20, elevation: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 4 }}>
              Weekly Overview
            </Text>
            <Text style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>
              Your mood each day this week
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'flex-end' }}>
              {last7.map((day, i) => {
                const cfg      = day.mood ? MOOD_ICON[day.mood] : null;
                const barColor = cfg ? cfg.color : T.border;
                return (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>

                    {/* Weather icon or placeholder dot */}
                    {cfg ? (
                      <View style={{ width: 34, height: 34, borderRadius: 17,
                        backgroundColor: cfg.color + '20',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                      </View>
                    ) : (
                      <View style={{ width: 34, height: 34, borderRadius: 17,
                        backgroundColor: T.bgMuted,
                        alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                        <Ionicons name="remove-outline" size={16} color={T.textMuted} />
                      </View>
                    )}

                    {/* Bar */}
                    <View style={{ width: 28, height: 60, borderRadius: 14,
                      backgroundColor: T.bgMuted, justifyContent: 'flex-end',
                      overflow: 'hidden' }}>
                      <View style={{
                        width: '100%',
                        height: day.mood ? '80%' : '8%',
                        backgroundColor: barColor,
                        borderRadius: 14,
                      }} />
                    </View>

                    {/* Day label */}
                    <Text style={{ fontSize: 10, marginTop: 6, fontWeight: '600',
                      color: day.isToday ? T.primary : T.textMuted }}>
                      {day.label}
                    </Text>

                    {/* Today dot */}
                    {day.isToday && (
                      <View style={{ width: 4, height: 4, borderRadius: 2,
                        backgroundColor: T.primary, marginTop: 2 }} />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Legend — icons only */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, gap: 8 }}>
              {MOOD_ORDER.filter(m => moodCounts[m]).map(m => {
                const cfg = MOOD_ICON[m];
                return (
                  <View key={m} style={{ flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                    backgroundColor: cfg.color + '18', gap: 5 }}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700',
                      color: cfg.color }}>{cfg.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Mood Breakdown ──────────────────────────────────────────── */}
          <Text style={{ fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 14 }}>
            Mood Breakdown
          </Text>

          {total === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="stats-chart-outline" size={48} color={T.textMuted} />
              <Text style={{ color: T.textSub, fontSize: 15, fontWeight: '600', marginTop: 12 }}>
                No data yet
              </Text>
              <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
                Start tracking your mood on the home screen
              </Text>
            </View>
          ) : MOOD_ORDER.map(mood => {
            const cfg   = MOOD_ICON[mood];
            const count = moodCounts[mood] || 0;
            const pct   = total > 0 ? count / total : 0;
            return (
              <View key={mood} style={{ backgroundColor: T.bgCard, borderRadius: 20,
                padding: 18, marginBottom: 12, elevation: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {/* Weather icon in coloured circle */}
                    <View style={{ width: 38, height: 38, borderRadius: 19,
                      backgroundColor: cfg.color + '20',
                      alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <Text style={{ fontWeight: '700', color: T.text, fontSize: 15 }}>
                      {cfg.label}
                    </Text>
                  </View>
                  <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '600' }}>
                    {count}x · {Math.round(pct * 100)}%
                  </Text>
                </View>
                {/* Progress bar */}
                <View style={{ height: 8, borderRadius: 8, backgroundColor: T.bgMuted }}>
                  <View style={{
                    height: 8, borderRadius: 8,
                    width: `${pct * 100}%`,
                    backgroundColor: cfg.color,
                  }} />
                </View>
              </View>
            );
          })}

          {/* ── Recent Activity ─────────────────────────────────────────── */}
          {history.length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: '800', color: T.text,
                marginBottom: 14, marginTop: 8 }}>
                Recent Activity
              </Text>
              {history.slice(0, 8).map((entry, idx) => {
                const cfg = MOOD_ICON[entry.mood] || MOOD_ICON.neutral;
                return (
                  <TouchableOpacity key={idx}
                    onPress={() => router.push({
                      pathname: '/MusicScreen',
                      params: { mood: entry.mood },
                    })}
                    style={{ flexDirection: 'row', alignItems: 'center',
                      backgroundColor: T.bgCard, borderRadius: 18,
                      padding: 16, marginBottom: 10, elevation: 1 }}>

                    {/* Icon circle */}
                    <View style={{ width: 42, height: 42, borderRadius: 21,
                      backgroundColor: cfg.color + '20',
                      alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: T.text, fontSize: 14 }}>
                        {cfg.label}
                      </Text>
                      <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>
                        {dayjs(entry.createdAt).format('MMM D · h:mm A')}
                      </Text>
                    </View>

                    <Ionicons name="musical-notes-outline" size={18} color={T.primary} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
