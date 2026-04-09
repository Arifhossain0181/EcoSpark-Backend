import nodemailer from "nodemailer";
import { prisma } from "../../config/Prisma";

type RecommendationItem = {
  id: string;
  title: string;
  category: string;
  isPaid: boolean;
  price: number;
  score: number;
  reasons: string[];
};

export type NewsletterBundle = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  subject: string;
  previewText: string;
  recommendations: RecommendationItem[];
  updates: {
    approvedLast7Days: number;
    paidApprovedLast7Days: number;
    trendingCategory: string;
  };
  html: string;
  text: string;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getSignals = async (userId: string) => {
  const [watchlist, paidPurchases, createdIdeas] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      select: {
        idea: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { userId, status: "SUCCESS" },
      select: {
        idea: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
            isPaid: true,
          },
        },
      },
    }),
    prisma.idea.findMany({
      where: { authorId: userId },
      select: {
        categoryId: true,
        category: { select: { name: true } },
      },
      take: 40,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const categoryWeights = new Map<string, { weight: number; name: string }>();

  for (const item of watchlist) {
    const existing = categoryWeights.get(item.idea.categoryId);
    categoryWeights.set(item.idea.categoryId, {
      weight: (existing?.weight || 0) + 3,
      name: item.idea.category.name,
    });
  }

  for (const purchase of paidPurchases) {
    const existing = categoryWeights.get(purchase.idea.categoryId);
    categoryWeights.set(purchase.idea.categoryId, {
      weight: (existing?.weight || 0) + 4,
      name: purchase.idea.category.name,
    });
  }

  for (const created of createdIdeas) {
    const existing = categoryWeights.get(created.categoryId);
    categoryWeights.set(created.categoryId, {
      weight: (existing?.weight || 0) + 2,
      name: created.category.name,
    });
  }

  const hasSuccessfulPurchase = paidPurchases.length > 0;
  return { categoryWeights, hasSuccessfulPurchase };
};

const scoreIdeas = (
  ideas: Array<{
    id: string;
    title: string;
    isPaid: boolean;
    price: number;
    createdAt: Date;
    categoryId: string;
    category: { name: string };
    _count: { votes: number; reviews: number; comments: number };
  }>,
  signals: { categoryWeights: Map<string, { weight: number; name: string }>; hasSuccessfulPurchase: boolean }
): RecommendationItem[] => {
  const now = Date.now();
  return ideas
    .map((idea) => {
      let score = 0;
      const reasons: string[] = [];

      const weight = signals.categoryWeights.get(idea.categoryId)?.weight || 0;
      if (weight > 0) {
        score += weight * 2;
        reasons.push(`matches your interest in ${idea.category.name}`);
      }

      const popularity = idea._count.votes * 2 + idea._count.reviews * 3 + idea._count.comments;
      if (popularity > 0) {
        score += popularity;
        reasons.push("trending on platform");
      }

      const ageDays = Math.floor((now - idea.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const recencyBonus = Math.max(0, 14 - ageDays);
      if (recencyBonus > 0) {
        score += recencyBonus;
        reasons.push("newly added");
      }

      if (signals.hasSuccessfulPurchase && idea.isPaid) {
        score += 5;
        reasons.push("premium match");
      } else if (!signals.hasSuccessfulPurchase && !idea.isPaid) {
        score += 3;
        reasons.push("free to start");
      }

      return {
        id: idea.id,
        title: idea.title,
        category: idea.category.name,
        isPaid: idea.isPaid,
        price: idea.price,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const buildEmailHtml = (bundle: Omit<NewsletterBundle, "html" | "text">): string => {
  const ideaRows = bundle.recommendations
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> (${item.category}) - ${item.isPaid ? `Paid ${formatCurrency(item.price)}` : "Free"}<br/><small>${item.reasons.join(", ")}</small></li>`
    )
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 680px; margin: 0 auto;">
    <h2 style="margin-bottom: 4px;">Hi ${bundle.user.name},</h2>
    <p style="margin-top: 0;">${bundle.previewText}</p>

    <h3>Your smart picks</h3>
    <ol>${ideaRows || "<li>No new recommendations right now.</li>"}</ol>

    <h3>EcoSpark updates</h3>
    <ul>
      <li>Approved ideas this week: <strong>${bundle.updates.approvedLast7Days}</strong></li>
      <li>New paid ideas this week: <strong>${bundle.updates.paidApprovedLast7Days}</strong></li>
      <li>Trending category: <strong>${bundle.updates.trendingCategory}</strong></li>
    </ul>

    <p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/ideas" style="color: #0f766e;">Explore ideas on EcoSpark</a></p>
    <p style="font-size: 12px; color: #6b7280;">You are receiving this email because you have an EcoSpark account.</p>
  </div>`;
};

const buildEmailText = (bundle: Omit<NewsletterBundle, "html" | "text">): string => {
  const list = bundle.recommendations.length
    ? bundle.recommendations
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.title} (${item.category}) - ${item.isPaid ? `Paid ${formatCurrency(item.price)}` : "Free"} | ${item.reasons.join(", ")}`
        )
        .join("\n")
    : "No new recommendations right now.";

  return [
    `Hi ${bundle.user.name},`,
    "",
    bundle.previewText,
    "",
    "Your smart picks:",
    list,
    "",
    "EcoSpark updates:",
    `- Approved ideas this week: ${bundle.updates.approvedLast7Days}`,
    `- New paid ideas this week: ${bundle.updates.paidApprovedLast7Days}`,
    `- Trending category: ${bundle.updates.trendingCategory}`,
    "",
    `Explore: ${(process.env.CLIENT_URL || "http://localhost:3000") + "/ideas"}`,
  ].join("\n");
};

export const buildNewsletterBundleForUser = async (userId: string): Promise<NewsletterBundle> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error("Active user not found");
  }

  const signals = await getSignals(userId);

  const [candidateIdeas, approvedLast7Days, paidApprovedLast7Days, topCategory] = await Promise.all([
    prisma.idea.findMany({
      where: {
        status: "APPROVED",
        authorId: { not: userId },
      },
      select: {
        id: true,
        title: true,
        isPaid: true,
        price: true,
        createdAt: true,
        categoryId: true,
        category: { select: { name: true } },
        _count: {
          select: {
            votes: true,
            reviews: true,
            comments: true,
          },
        },
      },
      take: 80,
      orderBy: { createdAt: "desc" },
    }),
    prisma.idea.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.idea.count({
      where: {
        status: "APPROVED",
        isPaid: true,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.category.findFirst({
      select: {
        name: true,
        _count: { select: { ideas: true } },
      },
      orderBy: {
        ideas: {
          _count: "desc",
        },
      },
    }),
  ]);

  const recommendations = scoreIdeas(candidateIdeas, signals);
  const subject = `Your EcoSpark smart recommendations (${new Date().toLocaleDateString("en-US")})`;
  const previewText = "Products, services, and updates selected from your EcoSpark activity.";

  const baseBundle = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    subject,
    previewText,
    recommendations,
    updates: {
      approvedLast7Days,
      paidApprovedLast7Days,
      trendingCategory: topCategory?.name || "Sustainability",
    },
  };

  return {
    ...baseBundle,
    html: buildEmailHtml(baseBundle),
    text: buildEmailText(baseBundle),
  };
};

const getTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseNumber(process.env.SMTP_PORT, 587);
  const user = (process.env.SMTP_USER || process.env.APP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.APP_PASSWORD || "").trim();

  if (!host || !user || !pass) {
    return null;
  }

  const normalizedPass = pass.toLowerCase().replace(/\s+/g, "");
  if (normalizedPass === "apppassword" || normalizedPass === "apppasswords") {
    throw new Error(
      "SMTP password is a placeholder. Use your real Gmail 16-character App Password in SMTP_PASS or APP_PASSWORD."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendNewsletterToUser = async (userId: string) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_USER/SMTP_PASS (or APP_USER/APP_PASSWORD)."
    );
  }

  const bundle = await buildNewsletterBundleForUser(userId);
  const from = process.env.NEWSLETTER_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from,
    to: bundle.user.email,
    subject: bundle.subject,
    html: bundle.html,
    text: bundle.text,
  });

  return {
    messageId: info.messageId,
    to: bundle.user.email,
    recommendations: bundle.recommendations.length,
  };
};

export const sendNewsletterToAllUsers = async (limit = 200) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "MEMBER",
    },
    select: { id: true, email: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      await sendNewsletterToUser(user.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${user.email}: ${msg}`);
    }
  }

  return {
    total: users.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  };
};
