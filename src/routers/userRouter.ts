/* eslint-disable @typescript-eslint/no-misused-promises */
import express from 'express';
import { usersHandlers } from '../handlers/usersHandlers';

const userRouter = express.Router();

userRouter.post('/register', usersHandlers.registerUser);
userRouter.post('/login', usersHandlers.loginUser);

export { userRouter };
