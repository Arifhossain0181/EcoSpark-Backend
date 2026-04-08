import express from 'express';
import { chatHandler } from './chat.controller';

const router = express.Router();

router.post('/chat', chatHandler);

export default router;