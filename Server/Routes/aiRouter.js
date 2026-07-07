import express from 'express';
import {
  getAIAdvice, analyzeJournalText, analyzeEmotion,
  combineMoodSources, chatWithAI, transcribeAudio,
} from '../controller/aiController.js';
import userAuth from '../middleware/userAuth.js';

const aiRouter = express.Router();
aiRouter.post('/advice',     userAuth, getAIAdvice);
aiRouter.post('/analyze',    userAuth, analyzeJournalText);
aiRouter.post('/emotion',    userAuth, analyzeEmotion);
aiRouter.post('/combine',    userAuth, combineMoodSources);
aiRouter.post('/chat',       userAuth, chatWithAI);
aiRouter.post('/transcribe', userAuth, transcribeAudio);
export default aiRouter;
