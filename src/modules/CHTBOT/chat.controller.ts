import { Request, Response } from 'express';
import { getChatResponse } from './chat.service.js';
import jwt from 'jsonwebtoken';

export const chatHandler = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    let currentUserId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId?: string };
        if (decoded?.userId) {
          currentUserId = decoded.userId;
        }
      } catch {
        currentUserId = undefined;
      }
    }

    // Fallback for custom frontend auth flows where userId is provided in body.
    if (!currentUserId && typeof req.body?.userId === 'string' && req.body.userId.trim()) {
      currentUserId = req.body.userId.trim();
    }

  const { message, history = [], projectContext } = req.body as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
    projectContext?: string;
    userId?: string;
  };

  if (!message || typeof message !== 'string') {
    res.status(400).json({ message: 'message is required' });
    return;
  }

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await getChatResponse(
      message,
      Array.isArray(history) ? history : [],
      typeof projectContext === 'string' ? projectContext : '',
      currentUserId,
      res
    );
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    res.write(
      'data: দুঃখিত, এখন সার্ভার থেকে বিস্তারিত তথ্য আনা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।\n\n'
    );
    res.write('data: [DONE]\n\n');
    res.end();
  }
};