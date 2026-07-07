import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedId = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('jwtToken');
      if (storedId && storedToken) {
        setUserId(storedId);
        const res = await userAPI.getData();
        if (res.success) {
          setUser(res.userData);
        } else {
          await clearSession();
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.success) {
      // Store userId for session restore
      await AsyncStorage.setItem('userId', res.userId.toString());
      // Generate a JWT-like session by storing the userId as token reference
      // The real JWT is in the cookie on web; for mobile we use userId in header
      // We'll store a simple session marker
      await AsyncStorage.setItem('jwtToken', res.token || res.userId.toString());
      setUserId(res.userId);

      // Fetch user profile
      const profile = await userAPI.getData();
      if (profile.success) setUser(profile.userData);
    }
    return res;
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const res = await authAPI.register(name, email, password);
    if (res.success) {
      await AsyncStorage.setItem('userId', res.userId.toString());
      await AsyncStorage.setItem('jwtToken', res.token || res.userId.toString());
      setUserId(res.userId);
      setUser({ name, isAccountVerified: false });
    }
    return res;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await authAPI.logout();
    await clearSession();
  };

  const clearSession = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('jwtToken');
    setUserId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, userId, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
