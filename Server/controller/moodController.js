// MindEase-Server/controller/moodController.js
import moodModel from '../model/moodModel.js';
import { getMusicPlaylist } from '../services/musicService.js';

const EMOTION_TO_MOOD = {
  happy:'happy', sad:'sad', angry:'angry', fear:'stressed', fearful:'stressed',
  stressed:'stressed', surprised:'happy', disgust:'angry', neutral:'neutral',
  calm:'neutral', positive:'happy', negative:'sad',
};

// ── Cache — never store empty results ─────────────────────────────────────────
const cache    = {};
const CACHE_MS = 20 * 60 * 1000; // 20 min

async function getPlaylist(mood) {
  const hit = cache[mood];
  const hasData = hit?.data?.genres &&
    Object.values(hit.data.genres).some(g => g.length > 0);

  if (hasData && Date.now() - hit.ts < CACHE_MS) return hit.data;

  const playlist = await getMusicPlaylist(mood);
  const gotData  = Object.values(playlist.genres || {}).some(g => g.length > 0);
  if (gotData) cache[mood] = { data: playlist, ts: Date.now() };
  return playlist;
}

// ── POST /api/mood/save ───────────────────────────────────────────────────────
export const saveMood = async (req, res) => {
  const { userId, mood, faceEmotion, textSentiment, confidence, note, journalId } = req.body;
  if (!userId || !mood)
    return res.json({ success: false, message: 'userId and mood required' });
  try {
    const entry = await moodModel.create({
      userId, mood,
      faceEmotion:   faceEmotion   || '',
      textSentiment: textSentiment || '',
      confidence:    confidence    || 0,
      note:          note          || '',
      journalId:     journalId     || '',
    });
    const playlist = await getPlaylist(mood).catch(() => null);
    return res.json({ success: true, entry, playlist });
  } catch (e) {
    return res.json({ success: false, message: e.message });
  }
};

// ── POST /api/mood/history ────────────────────────────────────────────────────
export const getMoodHistory = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.json({ success: false, message: 'userId required' });
  try {
    const history = await moodModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('-__v');
    return res.json({ success: true, history });
  } catch (e) {
    return res.json({ success: false, message: e.message });
  }
};

// ── POST /api/mood/combine ────────────────────────────────────────────────────
export const combineMoods = async (req, res) => {
  const { faceEmotion, textSentiment } = req.body;
  if (!faceEmotion && !textSentiment)
    return res.json({ success: false, message: 'At least one source required' });
  try {
    const faceMood   = faceEmotion   ? EMOTION_TO_MOOD[faceEmotion.toLowerCase()]   || 'neutral' : null;
    const textMood   = textSentiment ? EMOTION_TO_MOOD[textSentiment.toLowerCase()] || 'neutral' : null;
    const finalMood  = faceMood || textMood;
    const confidence = faceMood && textMood && faceMood === textMood ? 0.95 : 0.75;
    const playlist   = await getPlaylist(finalMood).catch(() => null);
    return res.json({ success: true, finalMood, faceMood, textMood, confidence, playlist });
  } catch (e) {
    return res.json({ success: false, message: e.message });
  }
};

// ── GET /api/mood/playlist/:mood ──────────────────────────────────────────────
export const getPlaylistByMood = async (req, res) => {
  const { mood } = req.params;
  try {
    const validMood = EMOTION_TO_MOOD[mood.toLowerCase()] || mood.toLowerCase();
    const playlist  = await getPlaylist(validMood);
    return res.json({ success: true, mood: validMood, playlist });
  } catch (e) {
    return res.json({
      success:  true,
      mood,
      playlist: { label: 'Music for You', genres: { global: [], afro: [], christian: [] } },
    });
  }
};
