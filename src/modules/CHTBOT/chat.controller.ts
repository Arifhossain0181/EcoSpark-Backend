import { Request, Response } from 'express';
import { getChatResponse } from './chat.service.js';

export const chatHandler = async (req: Request, res: Response) => {
  const { message, history = [] } = req.body as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
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
    await getChatResponse(message, Array.isArray(history) ? history : [], res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Chat request failed' });
      return;
    }
    res.end();
  }
};