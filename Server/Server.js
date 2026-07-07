import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './Config/mongodb.js';
import authRouter from './Routes/authRouter.js';
import userRouter from './Routes/userRouter.js';
import aiRouter from './Routes/aiRouter.js';
import journalRouter from './Routes/journalRouter.js';
import moodRouter from './Routes/moodRouter.js';
import streakRouter from './Routes/streakRouter.js';

const app = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth',    authRouter);
app.use('/api/user',    userRouter);
app.use('/api/ai',      aiRouter);
app.use('/api/journal', journalRouter);
app.use('/api/mood',    moodRouter);
app.use('/api/streak',  streakRouter);

app.get('/', (req, res) => res.json({ message: 'MindEase API is running ' }));

app.listen(port, () =>
  console.log(` MindEase Server running on port ${port}`)
);
