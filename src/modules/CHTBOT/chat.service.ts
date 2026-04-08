import { Response } from 'express';
import { getContextFromDB } from './db.js';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const sanitizeHistory = (history: Array<{ role: string; content: string }>): ChatMessage[] => {
  return history
    .filter((item) => typeof item?.content === 'string' && typeof item?.role === 'string')
    .map((item) => ({
      role: (['system', 'user', 'assistant'].includes(item.role) ? item.role : 'user') as ChatRole,
      content: item.content,
    }))
    .slice(-8);
};

export const getChatResponse = async (
  message: string,
  history: Array<{ role: string; content: string }>,
  res: Response
) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.write('data: OpenRouter API key is not configured.\\n\\n');
    res.write('data: [DONE]\\n\\n');
    res.end();
    return;
  }

  const dbContext = await getContextFromDB(message);

  const systemPrompt = `You are EcoSpark assistant.
Answer in the same language the user uses (Bangla or English).
Keep responses short, clear, and practical.
You can answer questions about platform data (ideas/projects, categories, comments, reviews, votes, payments, watchlist).
Never expose private user data like email, password, tokens, or personal identifiers.
${dbContext ? `\\nDatabase context:\\n${dbContext}` : ''}`;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...sanitizeHistory(history),
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorBody}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }

      const data = line.replace('data: ', '').trim();

      if (!data) {
        continue;
      }

      if (data === '[DONE]') {
        res.write('data: [DONE]\\n\\n');
        res.end();
        return;
      }

      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };

        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          res.write(`data: ${token}\\n\\n`);
        }
      } catch (err) {
        console.error('Failed to parse OpenRouter stream chunk:', err);
      }
    }
  }

  res.write('data: [DONE]\\n\\n');
  res.end();
};
