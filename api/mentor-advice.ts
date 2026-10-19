import express from 'express';
import { createMentorAdviceHandler } from '../src/server/mentorEndpoint';
import { verifyFirebaseIdToken } from '../src/server/firebaseAdmin';
import { getServerMentorAdvice } from '../src/server/mentorAdvice';

const app = express();
app.use(express.json({ limit: '256kb' }));
app.post('/api/mentor-advice', createMentorAdviceHandler(verifyFirebaseIdToken, getServerMentorAdvice));

export default app;
