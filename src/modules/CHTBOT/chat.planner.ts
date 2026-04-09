import { prisma } from '../../config/Prisma';

type PlannerAction = 'count' | 'findMany' | 'aggregate' | 'groupCount';

type PlannerQuery = {
  action: PlannerAction;
  table: string;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  label?: string;
};

type PlannerResult = {
  label: string;
  action: PlannerAction;
  table: string;
  data: unknown;
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PLANNER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-flash-1.5';

const openrouterHeaders = () => ({
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  'X-Title': 'EcoSpark Assistant',
});

const getModelName = (tableName: string): string | null => {
  const table = tableName.toLowerCase();
  const map: Record<string, string> = {
    ideas: 'idea',
    idea: 'idea',
    users: 'user',
    user: 'user',
    categories: 'category',
    category: 'category',
    payments: 'payment',
    payment: 'payment',
    comments: 'comment',
    comment: 'comment',
    reviews: 'review',
    review: 'review',
    votes: 'vote',
    vote: 'vote',
    watchlist: 'watchlist',
  };

  return map[table] ?? null;
};

const plannerPrompt = `You are a Prisma ORM query planner for the EcoSpark idea-sharing platform.

DATABASE SCHEMA:
Table: ideas       -> fields: id, title, problem, solution, description, isPaid(Boolean), price(Float), status(DRAFT|UNDER_REVIEW|APPROVED|REJECTED), categoryId, authorId, createdAt
Table: users       -> fields: id, name, email, role(MEMBER|MANAGER|ADMIN), isActive(Boolean), createdAt
Table: categories  -> fields: id, name
Table: payments    -> fields: id, userId, ideaId, amount(Float), status(PENDING|SUCCESS|FAILED), tranId, createdAt
Table: comments    -> fields: id, text, userId, ideaId, parentId, createdAt
Table: reviews     -> fields: id, rating(Int 1-5), comment, userId, ideaId, createdAt
Table: votes       -> fields: id, type(UP|DOWN), userId, ideaId
Table: watchlist   -> fields: id, userId, ideaId

YOUR TASK:
Look at the user's question and return a JSON array of database queries needed to answer it.

QUERY OBJECT FORMAT:
{
  "action": "count" | "findMany" | "aggregate" | "groupCount",
  "table": "<table name>",
  "where": { <prisma where clause> },
  "orderBy": { <field>: "asc"|"desc" },
  "take": <number>,
  "label": "<short description>"
}

RULES:
- Return ONLY a valid JSON array
- Return [] if question needs no DB data
- Max 5 queries per request`;

const parsePlannerOutput = (raw: string): PlannerQuery[] => {
  const clean = raw.replace(/```json|```/gi, '').trim();
  const parsed = JSON.parse(clean) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((item): item is PlannerQuery => {
      return Boolean(item) && typeof item === 'object' && typeof (item as PlannerQuery).action === 'string' && typeof (item as PlannerQuery).table === 'string';
    })
    .slice(0, 5);
};

const replaceUserPlaceholders = (value: unknown, userId?: string): unknown => {
  if (!userId) {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'USER_ID' || value === '${userId}' || value === 'USER_ID_PLACEHOLDER') {
      return userId;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceUserPlaceholders(item, userId));
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = replaceUserPlaceholders(v, userId);
    }
    return result;
  }

  return value;
};

const planDBQueries = async (
  message: string,
  history: Array<{ role: string; content: string }>,
  userId?: string
): Promise<PlannerQuery[]> => {
  const userContext = userId
    ? `The currently logged-in user's ID is: "${userId}". Use this for personal queries.`
    : 'No user is logged in.';

  const plannerPromptWithUser = `${plannerPrompt}\n\n${userContext}`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: openrouterHeaders(),
      body: JSON.stringify({
        model: PLANNER_MODEL,
        messages: [
          { role: 'system', content: plannerPromptWithUser },
          ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? '[]';
    return parsePlannerOutput(text);
  } catch {
    return [];
  }
};

const runQueries = async (plan: PlannerQuery[]): Promise<PlannerResult[]> => {
  const results: PlannerResult[] = [];

  for (const query of plan) {
    const modelName = getModelName(query.table);
    if (!modelName) {
      continue;
    }

    const delegate = (prisma as unknown as Record<string, any>)[modelName];
    if (!delegate) {
      continue;
    }

    const label = query.label || `${query.action}:${query.table}`;
    const where = { ...(query.where || {}) } as Record<string, any>;

    if (where?.createdAt?.gte === 'LAST_7_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      where.createdAt.gte = d;
    }

    if (where?.createdAt?.gte === 'LAST_30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      where.createdAt.gte = d;
    }

    try {
      let data: unknown;

      if (query.action === 'count') {
        data = await delegate.count({ where });
      } else if (query.action === 'findMany') {
        if (modelName === 'category') {
          data = await delegate.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { ideas: true } } },
          });
        } else if (modelName === 'idea') {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: 'desc' },
            include: {
              category: { select: { name: true } },
              author: { select: { name: true } },
              _count: { select: { votes: true, comments: true, reviews: true } },
            },
          });
        } else if (modelName === 'user') {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: 'desc' },
            select: { name: true, email: true, role: true, isActive: true, createdAt: true },
          });
        } else if (modelName === 'payment') {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: 'desc' },
            include: {
              user: { select: { name: true } },
              idea: { select: { title: true } },
            },
          });
        } else if (modelName === 'review') {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { rating: 'desc' },
            include: {
              user: { select: { name: true } },
              idea: { select: { title: true } },
            },
          });
        } else {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: 'desc' },
          });
        }
      } else if (query.action === 'aggregate') {
        if (modelName === 'payment') {
          data = await delegate.aggregate({
            where,
            _sum: { amount: true },
            _avg: { amount: true },
            _count: true,
          });
        } else if (modelName === 'review') {
          data = await delegate.aggregate({
            where,
            _avg: { rating: true },
            _min: { rating: true },
            _max: { rating: true },
            _count: true,
          });
        } else {
          data = await delegate.aggregate({ where, _count: true });
        }
      } else {
        if (modelName !== 'idea') {
          continue;
        }

        let grouped = await delegate.groupBy({
          by: ['categoryId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        });

        const categories = await prisma.category.findMany({
          select: { id: true, name: true },
        });

        grouped = grouped.map((item: { categoryId: string; _count: { id: number } }) => ({
          category: categories.find((c) => c.id === item.categoryId)?.name || item.categoryId,
          count: item._count.id,
        }));

        data = grouped;
      }

      results.push({
        label,
        action: query.action,
        table: query.table,
        data,
      });
    } catch {
      continue;
    }
  }

  return results;
};

const buildContext = (results: PlannerResult[]): string => {
  if (!results.length) {
    return '';
  }

  const lines: string[] = ['=== LIVE DATABASE DATA ==='];

  for (const result of results) {
    const data: any = result.data;

    if (result.action === 'count') {
      lines.push(`- ${result.label}: ${data}`);
      continue;
    }

    if (result.action === 'aggregate') {
      if (result.table === 'payments' || result.table === 'payment') {
        lines.push(
          `- ${result.label}: total=${data?._sum?.amount || 0}, avg=${data?._avg?.amount || 0}, tx=${data?._count || 0}`
        );
      } else if (result.table === 'reviews' || result.table === 'review') {
        lines.push(
          `- ${result.label}: avgRating=${data?._avg?.rating || 'N/A'}, min=${data?._min?.rating || 'N/A'}, max=${data?._max?.rating || 'N/A'}, total=${data?._count || 0}`
        );
      } else {
        lines.push(`- ${result.label}: ${JSON.stringify(data)}`);
      }
      continue;
    }

    if (result.action === 'groupCount') {
      lines.push(`- ${result.label}:`);
      for (const item of data || []) {
        lines.push(`  - ${item.category}: ${item.count}`);
      }
      continue;
    }

    if (!Array.isArray(data) || data.length === 0) {
      lines.push(`- ${result.label}: no records found`);
      continue;
    }

    if (result.table === 'ideas' || result.table === 'idea') {
      lines.push(`- ${result.label}:`);
      for (const idea of data.slice(0, 8)) {
        lines.push(
          `  - ${idea.title} | ${idea.isPaid ? `${idea.price} BDT` : 'Free'} | ${idea.status} | ${idea.category?.name || 'N/A'}`
        );
      }
      continue;
    }

    if (result.table === 'categories' || result.table === 'category') {
      lines.push(`- ${result.label}:`);
      for (const category of data.slice(0, 12)) {
        lines.push(`  - ${category.name}: ${category._count?.ideas || 0} ideas`);
      }
      continue;
    }

    lines.push(`- ${result.label}: ${JSON.stringify(data).slice(0, 400)}`);
  }

  return lines.join('\n');
};

export const getPlannedDbContext = async (
  message: string,
  history: Array<{ role: string; content: string }>,
  userId?: string
): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY) {
    return '';
  }

  const rawPlan = await planDBQueries(message, history, userId);
  const plan = rawPlan.map((query) => ({
    ...query,
    where: replaceUserPlaceholders(query.where, userId) as Record<string, unknown> | undefined,
  }));

  if (!plan.length) {
    return '';
  }

  const results = await runQueries(plan);
  return buildContext(results);
};
