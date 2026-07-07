import express from 'express';
import {
  saveMood,
  getMoodHistory,
  combineMoods,
  getPlaylistByMood,
} from '../controller/moodController.js';
import userAuth from '../middleware/userAuth.js';

const moodRouter = express.Router();

// POST /api/mood/save      → save a mood entry
moodRouter.post('/save', userAuth, saveMood);

// POST /api/mood/history   → get mood history
moodRouter.post('/history', userAuth, getMoodHistory);

// POST /api/mood/combine   → combine face + text emotions
moodRouter.post('/combine', userAuth, combineMoods);

// GET  /api/mood/playlist/:mood → get playlist for a mood (no auth needed)
moodRouter.get('/playlist/:mood', getPlaylistByMood);

export default moodRouter;
