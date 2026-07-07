import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Design System ────────────────────────────────────────────────────────────
export const THEMES = {
  light: {
    dark: false,
    bg:          '#F5F4FF',   // soft lavender background
    bgCard:      '#FFFFFF',
    bgInput:     '#F9F8FF',
    bgNav:       '#FFFFFF',
    bgMuted:     '#EDE9FE',
    primary:     '#7C3AED',
    primarySoft: '#EDE9FE',
    accent:      '#A78BFA',
    text:        '#1A1033',
    textSub:     '#6B6B8A',
    textMuted:   '#A0A0B8',
    border:      '#EDE9FE',
    shadow:      '#7C3AED18',
    success:     '#10B981',
    error:       '#EF4444',
    warning:     '#F59E0B',
    spotify:     '#1DB954',
    // mood colors
    moodHappy:   '#FEF3C7',
    moodSad:     '#DBEAFE',
    moodAngry:   '#FEE2E2',
    moodStressed:'#D1FAE5',
    moodNeutral: '#EDE9FE',
  },
  dark: {
    dark: true,
    bg:          '#12101E',
    bgCard:      '#1E1B30',
    bgInput:     '#252238',
    bgNav:       '#1A1733',
    bgMuted:     '#2D2848',
    primary:     '#A78BFA',
    primarySoft: '#2D2848',
    accent:      '#C4B5FD',
    text:        '#F0EEFF',
    textSub:     '#9F9DBF',
    textMuted:   '#6B698A',
    border:      '#2D2848',
    shadow:      '#00000040',
    success:     '#34D399',
    error:       '#F87171',
    warning:     '#FCD34D',
    spotify:     '#1DB954',
    moodHappy:   '#2D2410',
    moodSad:     '#0F2240',
    moodAngry:   '#2D1010',
    moodStressed:'#0D2518',
    moodNeutral: '#1E1B30',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(val => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleDark = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('darkMode', String(next));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// ─── Mood helpers ─────────────────────────────────────────────────────────────
export const MOOD_EMOJI  = { happy:'😊', sad:'😢', angry:'😡', stressed:'😰', neutral:'😐' };
export const MOOD_LABEL  = { happy:'Happy', sad:'Sad', angry:'Angry', stressed:'Stressed', neutral:'Neutral' };
export const moodColor = (mood, theme) => ({
  happy:   theme.moodHappy,
  sad:     theme.moodSad,
  angry:   theme.moodAngry,
  stressed:theme.moodStressed,
  neutral: theme.moodNeutral,
}[mood] || theme.bgMuted);
