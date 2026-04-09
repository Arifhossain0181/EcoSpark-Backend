import { Response } from 'express';
import { getContextFromDB, getProjectSnapshot, type ProjectSnapshot } from './db.js';
import { getPlannedDbContext } from './chat.planner.js';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-exp:free',
];

const writeSseData = (res: Response, text: string): void => {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    res.write(`data: ${line}\n`);
  }
  res.write('\n');
};

const writeSseDone = (res: Response): void => {
  res.write('data: [DONE]\n\n');
};

const sanitizeHistory = (history: Array<{ role: string; content: string }>): ChatMessage[] => {
  return history
    .filter((item) => typeof item?.content === 'string' && typeof item?.role === 'string')
    .map((item) => ({
      role: (['system', 'user', 'assistant'].includes(item.role) ? item.role : 'user') as ChatRole,
      content: item.content,
    }))
    .slice(-8);
};

const uniqueNonEmpty = (items: string[]): string[] => {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
};

const getTopCategoryNames = (snapshot: ProjectSnapshot, count = 3): string[] => {
  return [...snapshot.categories]
    .sort((a, b) => b.ideasCount - a.ideasCount)
    .slice(0, count)
    .map((category) => category.name);
};

const buildFaqGuidance = (snapshot: ProjectSnapshot): string => {
  const paidIdeas = snapshot.counts.paidIdeas;
  const freeIdeas = snapshot.counts.freeIdeas;

  return [
    'EcoSpark common tasks guide:',
    '1) Registration/Login: /auth/register এবং /auth/login থেকে account তৈরি/লগইন করুন।',
    `2) Idea explore: মোট ${snapshot.counts.ideas} ideas আছে (free ${freeIdeas}, paid ${paidIdeas})।`,
    '3) Paid idea access: payment complete হলে paid idea access পাওয়া যায়।',
    '4) Engagement: vote, comment, review, watchlist ব্যবহার করতে login থাকা দরকার।',
    '5) Dashboard: role অনুযায়ী Member/Manager/Admin panel use করুন।',
  ].join('\n');
};

const buildContentSuggestions = (snapshot: ProjectSnapshot): string => {
  const interestCategories = uniqueNonEmpty([
    ...snapshot.user.preferredCategories,
    ...snapshot.matchedCategories.map((category) => category.name),
    ...getTopCategoryNames(snapshot, 3),
  ]).slice(0, 3);

  const seedIdeas = (snapshot.matchedIdeas.length > 0
    ? snapshot.matchedIdeas.map((idea) => idea.title)
    : snapshot.latestIdeas.map((idea) => idea.title)
  ).slice(0, 3);

  const categoryText = interestCategories.length > 0 ? interestCategories.join(', ') : 'Sustainability';
  const ideaText = seedIdeas.length > 0 ? seedIdeas.join(', ') : 'platform ideas';

  return [
    'AI content suggestions (dynamic):',
    `- Blog topic: "${categoryText} এ top eco উদ্যোগ"`,
    `- Community post idea: "${ideaText} নিয়ে quick discussion"`,
    `- Newsletter theme: "এই সপ্তাহের ${categoryText} updates"`,
  ].join('\n');
};

const buildNewsletterRecommendations = (snapshot: ProjectSnapshot): string => {
  const topCategories = getTopCategoryNames(snapshot, 3);
  const userCategories = snapshot.user.preferredCategories.slice(0, 3);
  const picked = uniqueNonEmpty([...userCategories, ...topCategories]).slice(0, 3);

  const categoryText = picked.length > 0 ? picked.join(', ') : 'General sustainability';
  const trending = snapshot.latestIdeas.slice(0, 2).map((idea) => idea.title).join(', ') || 'No recent ideas';

  return [
    'Smart email/newsletter recommendation:',
    `- Audience focus: ${categoryText}`,
    `- Include: ${trending}`,
    `- CTA: নতুন idea explore করুন এবং vote/comment দিন।`,
    `- Frequency suggestion: weekly digest`,
  ].join('\n');
};

const buildFullDatabaseSummaryAnswer = (message: string, snapshot: ProjectSnapshot): string | null => {
  const q = message.toLowerCase();
  const asksDatabase = q.includes('database') || q.includes('db');
  const asksAllInfo =
    q.includes('all') ||
    q.includes('sob') ||
    q.includes('সব') ||
    q.includes('ja ja') ||
    q.includes('information') ||
    q.includes('info') ||
    q.includes('infromation') ||
    q.includes('details');

  if (!asksDatabase || !asksAllInfo) {
    return null;
  }

  const lines: string[] = [];
  lines.push('EcoSpark full database summary:');
  lines.push(`- users: ${snapshot.counts.users}`);
  lines.push(`- categories: ${snapshot.counts.categories}`);
  lines.push(
    `- ideas: ${snapshot.counts.ideas} (free: ${snapshot.counts.freeIdeas}, paid: ${snapshot.counts.paidIdeas}, approved: ${snapshot.counts.approvedIdeas})`
  );
  lines.push(`- comments: ${snapshot.counts.comments}`);
  lines.push(`- reviews: ${snapshot.counts.reviews}`);
  lines.push(`- votes: ${snapshot.counts.votes}`);
  lines.push(`- payments: ${snapshot.counts.payments}`);
  lines.push(`- watchlist: ${snapshot.counts.watchlist}`);

  if (snapshot.categories.length > 0) {
    lines.push(`- category list: ${snapshot.categories.slice(0, 10).map((c) => c.name).join(', ')}`);
  }

  if (snapshot.latestIdeas.length > 0) {
    lines.push(
      `- latest ideas: ${snapshot.latestIdeas
        .slice(0, 6)
        .map((idea) => `${idea.title} (${idea.category}, ${idea.status})`)
        .join(', ')}`
    );
  }

  if (snapshot.freeIdeaSamples.length > 0) {
    lines.push(
      `- free idea samples: ${snapshot.freeIdeaSamples
        .slice(0, 5)
        .map((idea) => `${idea.title} (${idea.category})`)
        .join(', ')}`
    );
  }

  if (snapshot.paidIdeaSamples.length > 0) {
    lines.push(
      `- paid idea samples: ${snapshot.paidIdeaSamples
        .slice(0, 5)
        .map((idea) => `${idea.title} (${idea.category}, price: ${idea.price})`)
        .join(', ')}`
    );
  }

  if (snapshot.user.id) {
    lines.push(
      `- your activity: payments ${snapshot.user.paidPurchases}, comments ${snapshot.user.commentsCount}, reviews ${snapshot.user.reviewsCount}, votes ${snapshot.user.votesCount}, watchlist ${snapshot.user.watchlistCount}, total spent ${snapshot.user.totalSpent}`
    );
  }

  lines.push('আরও নির্দিষ্ট কিছু চাইলে (যেমন শুধু reviews বা শুধু users) আলাদা করে জিজ্ঞেস করুন।');
  return lines.join('\n');
};

const buildPaidFreeIdeasAnswer = (message: string, snapshot: ProjectSnapshot): string | null => {
  const q = message.toLowerCase();

  const asksFreeIdeas =
    q.includes('free ideas') || q.includes('free idea') || q.includes('free') || q.includes('ফ্রি');
  const asksPaidIdeas =
    q.includes('paid ideas') ||
    q.includes('paid idea') ||
    q.includes('paid') ||
    q.includes('পেইড') ||
    q.includes('payment') ||
    q.includes('paymnet') ||
    q.includes('purchase');

  if (!asksFreeIdeas && !asksPaidIdeas) {
    return null;
  }

  if (asksFreeIdeas && !asksPaidIdeas) {
    const sampleText =
      snapshot.freeIdeaSamples.length > 0
        ? snapshot.freeIdeaSamples
            .slice(0, 5)
            .map((idea) => `${idea.title} (${idea.category})`)
            .join(', ')
        : 'এই মুহূর্তে free idea sample পাওয়া যায়নি';

    return [
      `Database অনুযায়ী free ideas আছে ${snapshot.counts.freeIdeas} টি।`,
      `Free idea samples: ${sampleText}`,
    ].join('\n');
  }

  if (asksPaidIdeas && !asksFreeIdeas) {
    const sampleText =
      snapshot.paidIdeaSamples.length > 0
        ? snapshot.paidIdeaSamples
            .slice(0, 5)
            .map((idea) => `${idea.title} (${idea.category}, price: ${idea.price})`)
            .join(', ')
        : 'এই মুহূর্তে paid idea sample পাওয়া যায়নি';

    return [
      `Database অনুযায়ী paid ideas আছে ${snapshot.counts.paidIdeas} টি।`,
      `Total successful payments: ${snapshot.counts.payments} টি।`,
      `Paid idea samples: ${sampleText}`,
    ].join('\n');
  }

  return [
    `Free ideas: ${snapshot.counts.freeIdeas} টি`,
    `Paid ideas: ${snapshot.counts.paidIdeas} টি`,
    `Total successful payments: ${snapshot.counts.payments} টি`,
  ].join('\n');
};

const buildOwnActivityAnswer = (message: string, snapshot: ProjectSnapshot): string | null => {
  const q = message.toLowerCase();
  const hasSelfKeyword =
    q.includes('ami') ||
    q.includes('amr') ||
    q.includes('amar') ||
    q.includes('my ') ||
    q.includes('i ') ||
    q.includes('id diye') ||
    q.includes('my id');

  if (!hasSelfKeyword) {
    return null;
  }

  const asksOwnComment = q.includes('comment');
  const asksOwnReview = q.includes('review') || q.includes('rating') || q.includes('riview');
  const asksOwnVote = q.includes('vote') || q.includes('voting');
  const asksOwnWatchlist = q.includes('watchlist') || q.includes('saved') || q.includes('bookmark');
  const hasIdeaKeyword = q.includes('idea') || q.includes('ideas') || q.includes('project');
  const hasCreateKeyword =
    q.includes('create') ||
    q.includes('created') ||
    q.includes('crate') ||
    q.includes('creat') ||
    q.includes('made') ||
    q.includes('post') ||
    q.includes('added') ||
    q.includes('banai') ||
    q.includes('banano') ||
    q.includes('kora') ||
    q.includes('korsi') ||
    q.includes('korci') ||
    q.includes('korchi') ||
    q.includes('korechi') ||
    q.includes('disi') ||
    q.includes('dichi');
  const asksOwnIdeas =
    hasIdeaKeyword && (hasCreateKeyword || q.includes('amar idea') || q.includes('my idea'));
  const asksPaidInfo = q.includes('paid information') || q.includes('paid info') || q.includes('paid ideas');
  const asksOwnPayment =
    q.includes('payment') || q.includes('paymnet') || q.includes('paid') || q.includes('purchase');

  if (
    !asksOwnComment &&
    !asksOwnReview &&
    !asksOwnVote &&
    !asksOwnWatchlist &&
    !asksOwnIdeas &&
    !asksOwnPayment &&
    !asksPaidInfo
  ) {
    return null;
  }

  if (!snapshot.user.id) {
    return [
      'আপনার personal activity check করার জন্য login করতে হবে।',
      'Login করার পর আবার জিজ্ঞেস করুন: "আমি কি comment/review/vote/payment করেছি?"',
    ].join('\n');
  }

  const lines: string[] = ['আপনার personal summary:'];

  if (asksOwnIdeas) {
    lines.push(
      `- Created ideas: ${snapshot.user.createdIdeasCount} (paid created: ${snapshot.user.createdPaidIdeasCount})`
    );
    if (snapshot.user.latestCreatedIdeas.length > 0) {
      lines.push(
        `- Latest created ideas: ${snapshot.user.latestCreatedIdeas
          .slice(0, 5)
          .map((idea) => `${idea.title} (${idea.isPaid ? 'Paid' : 'Free'}, ${idea.status})`)
          .join(', ')}`
      );
    }

    // When users ask about own created ideas, include a compact full activity view.
    if (!asksOwnComment && !asksOwnReview && !asksOwnVote && !asksOwnWatchlist && !asksOwnPayment) {
      lines.push(
        `- Activity totals: comments ${snapshot.user.commentsCount}, reviews ${snapshot.user.reviewsCount}, votes ${snapshot.user.votesCount}, watchlist ${snapshot.user.watchlistCount}`
      );
      lines.push(
        `- Payment totals: total ${snapshot.user.totalPayments}, success ${snapshot.user.successfulPayments}, pending ${snapshot.user.pendingPayments}, failed ${snapshot.user.failedPayments}, spent ${snapshot.user.totalSpent}`
      );
    }
  }

  if (asksOwnComment) {
    lines.push(`- Comments: ${snapshot.user.commentsCount}`);
  }

  if (asksOwnReview) {
    lines.push(`- Reviews: ${snapshot.user.reviewsCount}`);
  }

  if (asksOwnVote) {
    lines.push(`- Votes: ${snapshot.user.votesCount}`);
  }

  if (asksOwnWatchlist) {
    lines.push(`- Watchlist items: ${snapshot.user.watchlistCount}`);
  }

  if (asksOwnPayment || asksPaidInfo) {
    lines.push(
      `- Payment history: total ${snapshot.user.totalPayments}, success ${snapshot.user.successfulPayments}, pending ${snapshot.user.pendingPayments}, failed ${snapshot.user.failedPayments}`
    );
    lines.push(
      `- Paid purchases: ${snapshot.user.purchasedPaidIdeas}, total spent: ${snapshot.user.totalSpent}`
    );

    if (snapshot.user.latestPayments.length > 0) {
      lines.push(
        `- Recent payments: ${snapshot.user.latestPayments
          .slice(0, 5)
          .map((payment) => `${payment.ideaTitle} (${payment.amount}, ${payment.status})`)
          .join(', ')}`
      );
    }
  }

  if (asksPaidInfo) {
    lines.push(
      `- Platform paid info: paid ideas ${snapshot.counts.paidIdeas}, free ideas ${snapshot.counts.freeIdeas}, total successful payments ${snapshot.counts.payments}`
    );
  }

  if (lines.length === 1) {
    return null;
  }

  return lines.join('\n');
};

const buildCoreModuleInstantAnswer = (message: string, snapshot: ProjectSnapshot): string | null => {
  const q = message.toLowerCase();
  const hasSelfKeyword =
    q.includes('ami') ||
    q.includes('amr') ||
    q.includes('amar') ||
    q.includes('my ') ||
    q.includes('i ') ||
    q.includes('id diye') ||
    q.includes('my id');

  const asksAllModules =
    q.includes('sob') ||
    q.includes('সব') ||
    q.includes('all') ||
    q.includes('ja ja ase') ||
    q.includes('module') ||
    q.includes('database');

  const wantsUsers = q.includes('user') || q.includes('koi jon') || q.includes('koy jon') || q.includes('koto jon');
  const wantsCategories = q.includes('category') || q.includes('categories') || q.includes('catagory') || q.includes('catagori');
  const wantsIdeas = q.includes('idea') || q.includes('ideas') || q.includes('koita') || q.includes('koyta');
  const wantsComments = q.includes('comment');
  const wantsReviews = q.includes('review') || q.includes('rating') || q.includes('riview');
  const wantsVotes = q.includes('vote') || q.includes('voting');
  const wantsPayments =
    q.includes('payment') || q.includes('paymnet') || q.includes('paid') || q.includes('purchase');
  const wantsWatchlist = q.includes('watchlist');

  const hasSpecificModule =
    wantsUsers ||
    wantsCategories ||
    wantsIdeas ||
    wantsComments ||
    wantsReviews ||
    wantsVotes ||
    wantsPayments ||
    wantsWatchlist;

  // Personal queries should be handled by the personal activity handler, not global summary.
  if (hasSelfKeyword) {
    return null;
  }

  if (!asksAllModules && !hasSpecificModule) {
    return null;
  }

  const lines: string[] = ['EcoSpark live database summary:'];

  if (asksAllModules || wantsUsers) lines.push(`- users: ${snapshot.counts.users}`);
  if (asksAllModules || wantsCategories) lines.push(`- categories: ${snapshot.counts.categories}`);
  if (asksAllModules || wantsIdeas) {
    lines.push(
      `- ideas: ${snapshot.counts.ideas} (free: ${snapshot.counts.freeIdeas}, paid: ${snapshot.counts.paidIdeas}, approved: ${snapshot.counts.approvedIdeas})`
    );
  }
  if (asksAllModules || wantsComments) lines.push(`- comments: ${snapshot.counts.comments}`);
  if (asksAllModules || wantsReviews) lines.push(`- reviews: ${snapshot.counts.reviews}`);
  if (asksAllModules || wantsVotes) lines.push(`- votes: ${snapshot.counts.votes}`);
  if (asksAllModules || wantsPayments) lines.push(`- payments: ${snapshot.counts.payments}`);
  if (asksAllModules || wantsWatchlist) lines.push(`- watchlist: ${snapshot.counts.watchlist}`);

  if ((asksAllModules || wantsCategories) && snapshot.categories.length > 0) {
    lines.push(`- top categories: ${snapshot.categories.slice(0, 8).map((c) => c.name).join(', ')}`);
  }

  if ((asksAllModules || wantsIdeas) && snapshot.latestIdeas.length > 0) {
    lines.push(
      `- latest ideas: ${snapshot.latestIdeas
        .slice(0, 5)
        .map((idea) => `${idea.title} (${idea.category})`)
        .join(', ')}`
    );
  }

  return lines.join('\n');
};

const buildDynamicFallbackAnswer = (message: string, snapshot: ProjectSnapshot): string => {
  const q = message.toLowerCase();
  const categoriesText = snapshot.categories.map((category) => category.name).join(', ') || 'No categories yet';
  const latestIdeasText =
    snapshot.latestIdeas.length > 0
      ? snapshot.latestIdeas.map((idea) => `${idea.title} (${idea.category})`).join(', ')
      : 'No ideas yet';

  const fullDatabaseSummary = buildFullDatabaseSummaryAnswer(message, snapshot);
  if (fullDatabaseSummary) {
    return fullDatabaseSummary;
  }

  const ownActivityAnswer = buildOwnActivityAnswer(message, snapshot);
  if (ownActivityAnswer) {
    return ownActivityAnswer;
  }

  const paidFreeAnswer = buildPaidFreeIdeasAnswer(message, snapshot);
  if (paidFreeAnswer) {
    return paidFreeAnswer;
  }

  const coreModuleAnswer = buildCoreModuleInstantAnswer(message, snapshot);
  if (coreModuleAnswer) {
    return coreModuleAnswer;
  }

  const asksLoginHelp =
    q.includes('login') ||
    q.includes('log in') ||
    q.includes('signin') ||
    q.includes('sign in') ||
    q.includes('লগইন') ||
    q.includes('login hoy na') ||
    q.includes('হয় না');

  if (asksLoginHelp) {
    return [
      'Login সমস্যা হলে এইগুলো check করুন:',
      '1) Email/password ঠিক আছে কি না (extra space ছাড়া)',
      '2) আগে registration complete হয়েছে কি না',
      '3) Browser cookies/local storage clear করে আবার login',
      '4) Backend server running আছে কি না',
      '5) সমস্যা থাকলে password reset বা নতুন account দিয়ে verify করুন',
    ].join('\n');
  }

  const asksFaqSupport =
    q.includes('faq') ||
    q.includes('help') ||
    q.includes('support') ||
    q.includes('guide') ||
    q.includes('kibhabe') ||
    q.includes('how to') ||
    q.includes('booking') ||
    q.includes('product info');

  if (asksFaqSupport) {
    return buildFaqGuidance(snapshot);
  }

  const asksContentSuggestion =
    q.includes('content') ||
    q.includes('blog') ||
    q.includes('post') ||
    q.includes('suggest') ||
    q.includes('recommend') ||
    q.includes('idea for writing') ||
    q.includes('newsletter topic');

  if (asksContentSuggestion) {
    return buildContentSuggestions(snapshot);
  }

  const asksNewsletterEmail =
    q.includes('newsletter') ||
    q.includes('email') ||
    q.includes('mail') ||
    q.includes('digest') ||
    q.includes('campaign');

  if (asksNewsletterEmail) {
    return buildNewsletterRecommendations(snapshot);
  }

  const blocks: string[] = [];
  blocks.push(
    `EcoSpark live stats -> ideas: ${snapshot.counts.ideas}, free: ${snapshot.counts.freeIdeas}, paid: ${snapshot.counts.paidIdeas}, categories: ${snapshot.counts.categories}, comments: ${snapshot.counts.comments}, reviews: ${snapshot.counts.reviews}, votes: ${snapshot.counts.votes}, payments: ${snapshot.counts.payments}.`
  );

  if (snapshot.matchedCategories.length > 0) {
    blocks.push(
      `Matched categories: ${snapshot.matchedCategories
        .map((category) => `${category.name} (${category.ideasCount})`)
        .join(', ')}`
    );
  }

  if (snapshot.matchedIdeas.length > 0) {
    blocks.push(
      `Matched ideas: ${snapshot.matchedIdeas
        .slice(0, 5)
        .map((idea) => `${idea.title} [${idea.category}, ${idea.isPaid ? 'paid' : 'free'}]`)
        .join(', ')}`
    );
  }

  if (snapshot.user.id) {
    const latestBought =
      snapshot.user.latestPurchasedIdeas.length > 0
        ? snapshot.user.latestPurchasedIdeas.slice(0, 3).join(', ')
        : 'no purchased ideas yet';

    blocks.push(
      `Your account summary -> successful payments: ${snapshot.user.paidPurchases}, purchased paid ideas: ${snapshot.user.purchasedPaidIdeas}, total spent: ${snapshot.user.totalSpent}, latest purchases: ${latestBought}.`
    );
  }

  blocks.push(`Available categories: ${categoriesText}`);
  blocks.push(`Latest ideas: ${latestIdeasText}`);
  blocks.push('প্রশ্নটা একটু specific করলে আমি আরও নির্ভুল উত্তর দিতে পারব।');

  return blocks.join('\n');
};

const buildProjectContextFallback = (projectContext: string): string => {
  if (!projectContext.trim()) {
    return 'আমি এখন live database access পাচ্ছি না, কিন্তু EcoSpark এ auth, ideas, categories, comments, reviews, votes, payments, watchlist এবং role-based dashboard modules আছে।';
  }

  return `আমি এখন live database access পাচ্ছি না। তবে project context অনুযায়ী:\n${projectContext}`;
};

export const getChatResponse = async (
  message: string,
  history: Array<{ role: string; content: string }>,
  projectContext: string,
  currentUserId: string | undefined,
  res: Response
) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const preferredModel = process.env.OPENROUTER_MODEL;
  let snapshot: ProjectSnapshot | null = null;

  try {
    snapshot = await getProjectSnapshot(message, currentUserId);
  } catch (error) {
    console.error('Failed to load project snapshot:', error);
  }

  if (snapshot) {
    const fullDatabaseSummary = buildFullDatabaseSummaryAnswer(message, snapshot);
    if (fullDatabaseSummary) {
      writeSseData(res, fullDatabaseSummary);
      writeSseDone(res);
      res.end();
      return;
    }

    const ownActivityAnswer = buildOwnActivityAnswer(message, snapshot);
    if (ownActivityAnswer) {
      writeSseData(res, ownActivityAnswer);
      writeSseDone(res);
      res.end();
      return;
    }

    const paidFreeAnswer = buildPaidFreeIdeasAnswer(message, snapshot);
    if (paidFreeAnswer) {
      writeSseData(res, paidFreeAnswer);
      writeSseDone(res);
      res.end();
      return;
    }

    const coreModuleAnswer = buildCoreModuleInstantAnswer(message, snapshot);
    if (coreModuleAnswer) {
      writeSseData(res, coreModuleAnswer);
      writeSseDone(res);
      res.end();
      return;
    }
  }

  if (!apiKey) {
    const fallback = snapshot
      ? buildDynamicFallbackAnswer(message, snapshot)
      : buildProjectContextFallback(projectContext);
    writeSseData(res, fallback);
    writeSseDone(res);
    res.end();
    return;
  }

  let dbContext = '';
  try {
    dbContext = await getPlannedDbContext(message, sanitizeHistory(history), currentUserId);
    if (!dbContext) {
      dbContext = await getContextFromDB(message, currentUserId);
    }
  } catch (error) {
    console.error('Failed to build DB context:', error);
  }

  const systemPrompt = `You are EcoSpark assistant.
Answer in the same language the user uses (Bangla or English).
Keep responses short, clear, and practical.
Prefer bullet points for list-style answers.
Highlight key numbers in a noticeable style (for example: **12 টি paid idea**).
For personal queries, answer only using the current logged-in user's data when available.
You can answer questions about platform data (ideas/projects, categories, comments, reviews, votes, payments, watchlist).
You can also provide support guidance (FAQ/common tasks), AI content suggestions (blog/post/newsletter ideas), and smart newsletter recommendations aligned with live platform data and user interests.
If the user asks about project features/pages/roles/flows, use the project context below.
Never expose private user data like email, password, tokens, or personal identifiers.
${projectContext ? `\nProject context:\n${projectContext}` : ''}
${dbContext ? `\nDatabase context:\n${dbContext}` : ''}`;

  const modelCandidates = preferredModel
    ? [preferredModel, ...DEFAULT_MODELS.filter((model) => model !== preferredModel)]
    : DEFAULT_MODELS;

  let response: globalThis.Response | null = null;
  let lastErrorBody = '';

  for (const model of modelCandidates) {
    const candidateResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizeHistory(history),
          { role: 'user', content: message },
        ],
      }),
    });

    if (candidateResponse.ok && candidateResponse.body) {
      response = candidateResponse;
      break;
    }

    lastErrorBody = await candidateResponse.text();
    console.error(`OpenRouter model failed (${model}): ${candidateResponse.status} ${lastErrorBody}`);

    // Retry only when model endpoint is unavailable; otherwise break and fallback.
    if (candidateResponse.status !== 404) {
      break;
    }
  }

  if (!response || !response.body) {
    if (lastErrorBody) {
      console.error(`OpenRouter request failed after retries: ${lastErrorBody}`);
    }
    const fallback = snapshot
      ? buildDynamicFallbackAnswer(message, snapshot)
      : buildProjectContextFallback(projectContext);
    writeSseData(res, fallback);
    writeSseDone(res);
    res.end();
    return;
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
        writeSseDone(res);
        res.end();
        return;
      }

      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };

        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          writeSseData(res, token);
        }
      } catch (err) {
        console.error('Failed to parse OpenRouter stream chunk:', err);
      }
    }
  }

  writeSseDone(res);
  res.end();
};
