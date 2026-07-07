import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ visible, message, type = 'error', onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide && onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const config = {
    error:   { bg: '#FEF2F2', border: '#FCA5A5', icon: 'close-circle',       iconColor: '#EF4444' },
    success: { bg: '#F0FDF4', border: '#86EFAC', icon: 'checkmark-circle',    iconColor: '#22C55E' },
    info:    { bg: '#EFF6FF', border: '#93C5FD', icon: 'information-circle',  iconColor: '#3B82F6' },
  }[type] || { bg: '#FEF2F2', border: '#FCA5A5', icon: 'close-circle', iconColor: '#EF4444' };

  if (!visible) return null;

  return (
    <Animated.View style={{
      opacity,
      transform: [{ translateY }],
      position: 'absolute',
      top: 60, left: 16, right: 16,
      zIndex: 999,
      backgroundColor: config.bg,
      borderWidth: 1,
      borderColor: config.border,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }}>
      <Ionicons name={config.icon} size={22} color={config.iconColor} />
      <Text style={{ flex: 1, marginLeft: 10, color: '#374151', fontSize: 14, fontWeight: '500' }}>
        {message}
      </Text>
    </Animated.View>
  );
}
