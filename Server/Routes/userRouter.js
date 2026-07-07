import express from 'express';
import { getUserData } from '../controller/usercontroller.js';
import userAuth from '../middleware/userAuth.js';

const userRouter = express.Router();

userRouter.post('/data', userAuth, getUserData);

export default userRouter;
