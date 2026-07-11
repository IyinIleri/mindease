import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://mindease-rc9p.onrender.com'; // Production (Render)
// export const BASE_URL = 'http://10.241.114.42:5000'; // Local dev only

async function request(endpoint, options = {}) {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers, ...options });
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Network error. Check your server IP in services/api.js' };
  }
}

export const authAPI = {
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  sendVerifyOtp: (userId) =>
    request('/api/auth/send-verify-otp', { method: 'POST', body: JSON.stringify({ userId }) }),
  verifyEmail: (userId, otp) =>
    request('/api/auth/verify-account', { method: 'POST', body: JSON.stringify({ userId, otp }) }),
  sendResetOtp: (email) =>
    request('/api/auth/send-reset-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) =>
    request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  isAuth: () => request('/api/auth/is-auth', { method: 'POST' }),
};

export const userAPI = {
  getData: () => request('/api/user/data', { method: 'POST' }),
};

export const aiAPI = {
  getAdvice: (text, mood, journalId, faceEmotion) =>
    request('/api/ai/advice', { method: 'POST', body: JSON.stringify({ text, mood, journalId, faceEmotion }) }),
  analyzeText: (text) =>
    request('/api/ai/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  analyzeEmotion: (imageBase64) =>
    request('/api/ai/emotion', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
  combineMoods: (faceEmotion, faceConfidence, textMood, textConfidence, journalId) =>
    request('/api/ai/combine', { method: 'POST', body: JSON.stringify({ faceEmotion, faceConfidence, textMood, textConfidence, journalId }) }),
  chat: (messages, mood) =>
    request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages, mood }) }),
  transcribe: (audioBase64, mimeType) =>
    request('/api/ai/transcribe', { method: 'POST', body: JSON.stringify({ audioBase64, mimeType }) }),
};

export const journalAPI = {
  save: (text, journalId, faceEmotion, detectedMood) =>
    request('/api/journal/save', { method: 'POST', body: JSON.stringify({ text, journalId, faceEmotion, detectedMood }) }),
  list: () => request('/api/journal/list', { method: 'POST' }),
  getById: (id) => request(`/api/journal/${id}`, { method: 'GET' }),
  delete: (id) => request(`/api/journal/${id}`, { method: 'DELETE' }),
  finalize: (id, spotifyRecommendations) =>
    request(`/api/journal/${id}/finalize`, { method: 'POST', body: JSON.stringify({ spotifyRecommendations }) }),
};

export const moodAPI = {
  save: (mood, faceEmotion, textSentiment, confidence, note) =>
    request('/api/mood/save', { method: 'POST', body: JSON.stringify({ mood, faceEmotion, textSentiment, confidence, note }) }),
  history: () => request('/api/mood/history', { method: 'POST' }),
  playlist: (mood) => request(`/api/mood/playlist/${mood}`),
};

export const streakAPI = {
  get: () => request('/api/streak', { method: 'POST' }),
  summary: () => request('/api/streak/summary', { method: 'POST' }),
  saveOnboarding: (reason, stressLevel, goal) =>
    request('/api/streak/onboarding', { method: 'POST', body: JSON.stringify({ reason, stressLevel, goal }) }),
};
