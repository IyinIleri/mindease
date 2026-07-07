import express from 'express';
import { getStreak, getWeeklySummary, saveOnboarding } from '../controller/streakController.js';
import userAuth from '../middleware/userAuth.js';

const streakRouter = express.Router();

streakRouter.post('/', userAuth, getStreak);
streakRouter.post('/summary', userAuth, getWeeklySummary);
streakRouter.post('/onboarding', userAuth, saveOnboarding);

export default streakRouter;
