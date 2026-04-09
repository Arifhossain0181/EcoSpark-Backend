import { IdeaQuery } from "../../tyPes";

import { prisma } from "../../config/Prisma";
import { Status } from "../../generated/prisma/enums";
import { PaymentStatus } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

export type SuggestionItem = {
  id: string;
  type: "IDEA" | "CATEGORY";
  title: string;
  subtitle: string;
  score: number;
};

export type RecommendationItem = {
  id: string;
  title: string;
  category: string;
  isPaid: boolean;
  price: number;
  score: number;
  reasons: string[];
};

export type RecommendationClickAnalytics = {
  days: number;
  totalClicks: number;
  topCategories: Array<{ category: string; clicks: number }>;
};

const SEARCH_AI_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

const createHttpError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
};

const daysBetween = (from: Date, to = new Date()): number => {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const getAiSearchTerms = async (query: string): Promise<string[]> => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3200);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SEARCH_AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Return only a JSON array of up to 5 short search terms related to the user query. No explanation.",
          },
          { role: "user", content: query },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return [];
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
};

export const getSearchSuggestions = async (
  query: string,
  userId?: string
): Promise<SuggestionItem[]> => {
  const input = query.trim();
  if (input.length < 2) return [];

  const aiTerms = await getAiSearchTerms(input);
  const terms = Array.from(
    new Set([input, ...aiTerms].map(normalizeText).filter((term) => term.length >= 2))
  ).slice(0, 6);

  const containsOr = terms.flatMap((term) => [
    { title: { contains: term, mode: "insensitive" as const } },
    { description: { contains: term, mode: "insensitive" as const } },
    { problem: { contains: term, mode: "insensitive" as const } },
    { category: { name: { contains: term, mode: "insensitive" as const } } },
  ]);

  const [ideas, categories, userPaidCount] = await Promise.all([
    prisma.idea.findMany({
      where: {
        status: Status.APPROVED,
        OR: containsOr,
      },
      select: {
        id: true,
        title: true,
        isPaid: true,
        price: true,
        category: { select: { name: true } },
        _count: {
          select: {
            votes: true,
            comments: true,
            reviews: true,
            payments: true,
          },
        },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: {
        OR: terms.map((term) => ({
          name: { contains: term, mode: "insensitive" as const },
        })),
      },
      select: {
        id: true,
        name: true,
        _count: { select: { ideas: true } },
      },
      take: 6,
    }),
    userId
      ? prisma.payment.count({
          where: {
            userId,
            status: PaymentStatus.SUCCESS,
          },
        })
      : Promise.resolve(0),
  ]);

  const q = normalizeText(input);
  const ideaSuggestions: SuggestionItem[] = ideas.map((idea) => {
    let score = 0;
    const title = normalizeText(idea.title);

    if (title.startsWith(q)) score += 70;
    if (title.includes(q)) score += 30;
    score += Math.min(35, idea._count.votes * 2 + idea._count.reviews * 3 + idea._count.comments);
    if (idea.isPaid && userPaidCount > 0) score += 8;

    return {
      id: idea.id,
      type: "IDEA",
      title: idea.title,
      subtitle: `${idea.category.name} • ${idea.isPaid ? `Paid $${idea.price.toFixed(2)}` : "Free"}`,
      score,
    };
  });

  const categorySuggestions: SuggestionItem[] = categories.map((category) => {
    const name = normalizeText(category.name);
    let score = 20;
    if (name.startsWith(q)) score += 45;
    if (name.includes(q)) score += 20;
    score += Math.min(20, category._count.ideas);

    return {
      id: category.id,
      type: "CATEGORY",
      title: category.name,
      subtitle: `${category._count.ideas} ideas`,
      score,
    };
  });

  return [...ideaSuggestions, ...categorySuggestions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

export const getPersonalRecommendations = async (userId: string): Promise<RecommendationItem[]> => {
  const ideaInteractionDelegate = (prisma as unknown as { ideaInteraction?: any }).ideaInteraction;
  const [watchlist, successfulPayments, createdIdeas, votes, reviews, comments, interactions] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
    }),
    prisma.payment.findMany({
      where: { userId, status: PaymentStatus.SUCCESS },
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
      select: { categoryId: true, category: { select: { name: true } } },
      take: 40,
      orderBy: { createdAt: "desc" },
    }),
    prisma.vote.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
      take: 80,
    }),
    prisma.review.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
      take: 80,
    }),
    prisma.comment.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
      take: 80,
    }),
    ideaInteractionDelegate?.findMany
      ? ideaInteractionDelegate
          .findMany({
            where: { userId, type: "RECOMMENDATION_CLICK" },
            select: {
              idea: {
                select: {
                  categoryId: true,
                  category: { select: { name: true } },
                },
              },
            },
            take: 120,
            orderBy: { createdAt: "desc" },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const categoryWeights = new Map<string, { weight: number; name: string }>();
  const addWeight = (categoryId: string, name: string, weight: number) => {
    const prev = categoryWeights.get(categoryId);
    categoryWeights.set(categoryId, {
      name,
      weight: (prev?.weight || 0) + weight,
    });
  };

  for (const item of watchlist) addWeight(item.idea.categoryId, item.idea.category.name, 3);
  for (const item of successfulPayments) addWeight(item.idea.categoryId, item.idea.category.name, 4);
  for (const item of createdIdeas) addWeight(item.categoryId, item.category.name, 2);
  for (const item of votes) addWeight(item.idea.categoryId, item.idea.category.name, 2);
  for (const item of reviews) addWeight(item.idea.categoryId, item.idea.category.name, 2);
  for (const item of comments) addWeight(item.idea.categoryId, item.idea.category.name, 1);
  for (const item of interactions) addWeight(item.idea.categoryId, item.idea.category.name, 3);

  const hasPaidBehavior = successfulPayments.length > 0;

  const candidateIdeas = await prisma.idea.findMany({
    where: {
      status: Status.APPROVED,
      authorId: { not: userId },
    },
    select: {
      id: true,
      title: true,
      description: true,
      isPaid: true,
      price: true,
      createdAt: true,
      categoryId: true,
      category: { select: { name: true } },
      _count: {
        select: {
          votes: true,
          comments: true,
          reviews: true,
          payments: true,
        },
      },
    },
    take: 120,
    orderBy: { createdAt: "desc" },
  });

  return candidateIdeas
    .map((idea) => {
      let score = 0;
      const reasons: string[] = [];

      const categorySignal = categoryWeights.get(idea.categoryId);
      if (categorySignal) {
        score += categorySignal.weight * 3;
        reasons.push(`matches your interest in ${idea.category.name}`);
      }

      const engagement =
        idea._count.votes * 2 +
        idea._count.reviews * 3 +
        idea._count.comments +
        idea._count.payments * 4;
      if (engagement > 0) {
        score += Math.min(50, engagement);
        reasons.push("high engagement");
      }

      const ageDays = daysBetween(idea.createdAt);
      const recencyBonus = Math.max(0, 14 - ageDays);
      if (recencyBonus > 0) {
        score += recencyBonus;
        reasons.push("fresh this week");
      }

      if (hasPaidBehavior && idea.isPaid) {
        score += 8;
        reasons.push("premium match");
      }
      if (!hasPaidBehavior && !idea.isPaid) {
        score += 5;
        reasons.push("free starter fit");
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
    .slice(0, 10);
};

export const getTrendingRecommendations = async (): Promise<RecommendationItem[]> => {
  const ideas = await prisma.idea.findMany({
    where: { status: Status.APPROVED },
    select: {
      id: true,
      title: true,
      isPaid: true,
      price: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: {
        select: {
          votes: true,
          comments: true,
          reviews: true,
          payments: true,
        },
      },
    },
    take: 150,
    orderBy: { createdAt: "desc" },
  });

  return ideas
    .map((idea) => {
      const engagement =
        idea._count.votes * 2 +
        idea._count.reviews * 3 +
        idea._count.comments +
        idea._count.payments * 4;
      const recencyBonus = Math.max(0, 14 - daysBetween(idea.createdAt));
      const score = engagement + recencyBonus;

      const reasons: string[] = [];
      if (engagement > 0) reasons.push("popular now");
      if (recencyBonus > 0) reasons.push("newly posted");

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
    .slice(0, 10);
};

export const trackIdeaInteraction = async (
  ideaId: string,
  userId: string,
  type: string
): Promise<void> => {
  const ideaInteractionDelegate = (prisma as unknown as { ideaInteraction?: any }).ideaInteraction;
  if (!ideaInteractionDelegate?.create) {
    return;
  }

  await ideaInteractionDelegate
    .create({
      data: {
        ideaId,
        userId,
        type,
      },
    })
    .catch(() => {
      // Ignore when table is not migrated yet or tracking write fails.
    });
};

export const getRecommendationClickAnalytics = async (
  days = 7
): Promise<RecommendationClickAnalytics> => {
  const ideaInteractionDelegate = (prisma as unknown as { ideaInteraction?: any }).ideaInteraction;
  if (!ideaInteractionDelegate?.findMany) {
    return { days, totalClicks: 0, topCategories: [] };
  }

  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);

  const rows = await ideaInteractionDelegate
    .findMany({
      where: {
        type: {
          in: ["RECOMMENDATION_CLICK", "TRENDING_CLICK"],
        },
        createdAt: { gte: since },
      },
      select: {
        idea: {
          select: {
            category: { select: { name: true } },
          },
        },
      },
      take: 5000,
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const map = new Map<string, number>();
  for (const row of rows) {
    const categoryName = row.idea?.category?.name || "Unknown";
    map.set(categoryName, (map.get(categoryName) || 0) + 1);
  }

  const topCategories = Array.from(map.entries())
    .map(([category, clicks]) => ({ category, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6);

  return {
    days,
    totalClicks: rows.length,
    topCategories,
  };
};

export const getAllIdeas = async (query: IdeaQuery) => {
  const {
    search,
    category,
    isPaid,
    sort,
    page = "1",
    limit = "10",
    includeTotal = "true",
  } = query;

  const where: any = {
    status: Status.APPROVED,
  };
  if (search) {
		where.OR = [
			{ title: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
  }
  if (category) {
		where.category = { name: category };
  }
  if (isPaid) {
		where.isPaid = isPaid === "true";
  }
  const orderBy: any =
		sort === "recent"
			? { createdAt: "desc" }
			: sort === "top"
				? { votes: { _count: "desc" } }
				: sort === "commented"
					? { comments: { _count: "desc" } }
					: { createdAt: "desc" };
	const skip = (parseInt(page) - 1) * parseInt(limit);
  const shouldIncludeTotal = includeTotal !== "false";

  const ideas = await prisma.idea.findMany({
    where,
    orderBy,
    skip,
    take: parseInt(limit),
    include: {
      author: {
        select: {
          id: true,
          name: true,
            avatar: true,
        },
      },
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
  });

  const total = shouldIncludeTotal
    ? await prisma.idea.count({ where })
    : ideas.length;

  return {
    ideas,
    total,
    page: shouldIncludeTotal ? Math.ceil(total / parseInt(limit)) : 1,
    limit: parseInt(limit),
  };
};

export const getIdeaById = async (id: string) => {
  const idea = await prisma.idea.findUniqueOrThrow({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
	          avatar: true,
        },
      },
      category: true,
      _count: {
        select: {
	          votes: true,
          comments: true,
        },
      },
      votes: {
        select: {
          userId: true,
          type: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!idea) throw new Error("Idea not found");
  return idea;
};
export const createIdea = async (data: any, authorId: string) => {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const problem = typeof data.problem === "string" ? data.problem.trim() : "";
  const solution = typeof data.solution === "string" ? data.solution.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const categoryId =
    typeof data.categoryId === "string" ? data.categoryId.trim() : "";

  if (!title || !problem || !solution || !description || !categoryId) {
    throw createHttpError(
      "title, problem, solution, description and categoryId are required",
      400
    );
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw createHttpError("Invalid categoryId", 400);
  }

  const normalizedImages = Array.isArray(data.images)
    ? data.images.filter((img: unknown) => typeof img === "string" && img.trim() !== "")
    : typeof data.image === "string" && data.image.trim()
      ? [data.image.trim()]
      : [];

  const isPaid = Boolean(data.isPaid);
  const price = Number(data.price ?? 0);
  if (isPaid && (!Number.isFinite(price) || price <= 0)) {
    throw createHttpError("Paid ideas must have a valid price greater than 0", 400);
  }

  return await prisma.idea.create({
    data: {
      title,
      problem,
      solution,
      description,
      categoryId,
      isPaid,
      price: isPaid ? price : 0,
      authorId,
      status: Status.DRAFT,
      images: normalizedImages,
    },
  });
};
export const submitIdea = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== userId) throw new Error("Unauthorized");
  if (
    idea.status !== Status.DRAFT &&
    idea.status !== Status.REJECTED &&
    idea.status !== Status.APPROVED
  ) {
    throw new Error("Only draft, rejected, or approved ideas can be submitted");
  }
  return await prisma.idea.update({
    where: { id },
    data: { status: Status.UNDER_REVIEW },
  });
};
export const uPdateIdea = async (id: string, data: any, userId: string) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== userId) throw createHttpError("Unauthorized", 403);

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const problem = typeof data.problem === "string" ? data.problem.trim() : "";
    const solution = typeof data.solution === "string" ? data.solution.trim() : "";
    const description =
      typeof data.description === "string" ? data.description.trim() : "";
    const categoryId =
      typeof data.categoryId === "string" ? data.categoryId.trim() : "";

    if (!title || !problem || !solution || !description || !categoryId) {
      throw createHttpError(
        "title, problem, solution, description and categoryId are required",
        400
      );
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw createHttpError("Invalid categoryId", 400);
    }

    if (idea.isPaid) {
      const successfulPaymentCount = await prisma.payment.count({
        where: {
          ideaId: id,
          status: PaymentStatus.SUCCESS,
        },
      });

      if (successfulPaymentCount > 0) {
        throw createHttpError(
          "This paid idea already has successful payments and cannot be edited",
          400
        );
      }
    }

    const normalizedImages = Array.isArray(data.images)
      ? data.images.filter((img: unknown) => typeof img === "string" && img.trim() !== "")
      : [];

    const isPaid = Boolean(data.isPaid);
    const price = Number(data.price ?? 0);
    if (isPaid && (!Number.isFinite(price) || price <= 0)) {
      throw createHttpError("Paid ideas must have a valid price greater than 0", 400);
    }

    const nextStatus =
      idea.status === Status.APPROVED ? Status.UNDER_REVIEW : idea.status;

    return await prisma.idea.update({
      where: { id },
      data: {
        title,
        problem,
        solution,
        description,
        categoryId,
        isPaid,
        price: isPaid ? price : 0,
        images: normalizedImages,
        status: nextStatus,
      }
    });
}
export const deleteIdea = async (id: string, userId: string ,role: string) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== userId && role !== "ADMIN" && role !== "MANAGER") {
      throw createHttpError("Unauthorized", 403);
    }

    if (idea.isPaid) {
      const successfulPaymentCount = await prisma.payment.count({
        where: {
          ideaId: id,
          status: PaymentStatus.SUCCESS,
        },
      });

      if (successfulPaymentCount > 0) {
        throw createHttpError(
          "This paid idea already has successful payments and cannot be deleted",
          400
        );
      }
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Remove dependent rows first to satisfy FK constraints.
        await tx.vote.deleteMany({ where: { ideaId: id } });
        await tx.review.deleteMany({ where: { ideaId: id } });
        await tx.watchlist.deleteMany({ where: { ideaId: id } });
        await tx.payment.deleteMany({ where: { ideaId: id } });

        // Self-referencing comments must be deleted children-first.
        await tx.comment.deleteMany({
          where: {
            ideaId: id,
            parentId: { not: null },
          },
        });
        await tx.comment.deleteMany({
          where: {
            ideaId: id,
            parentId: null,
          },
        });

        return tx.idea.delete({ where: { id } });
      });
    } catch (error) {
      const err = error as Prisma.PrismaClientKnownRequestError;

      // Fallback for environments where stale constraints still block delete.
      if (err.code === "P2003") {
        return await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe('DELETE FROM "Vote" WHERE "ideaId" = $1', id);
          await tx.$executeRawUnsafe('DELETE FROM "Review" WHERE "ideaId" = $1', id);
          await tx.$executeRawUnsafe('DELETE FROM "Watchlist" WHERE "ideaId" = $1', id);
          await tx.$executeRawUnsafe('DELETE FROM "Payment" WHERE "ideaId" = $1', id);

          await tx.comment.deleteMany({
            where: {
              ideaId: id,
              parentId: { not: null },
            },
          });
          await tx.comment.deleteMany({
            where: {
              ideaId: id,
              parentId: null,
            },
          });

          return tx.idea.delete({ where: { id } });
        });
      }

      throw error;
    }


}
export const getmyIdeas = async(authorId:string)=>{
    return await prisma.idea.findMany({
        where:{authorId},
        include:{
            category:true,
            payments: {
              where: {
                status: PaymentStatus.SUCCESS,
              },
              select: {
                id: true,
              },
              take: 1,
            },
            _count:{
                select:{
	                votes:true,
                    comments:true
                }
            }

        },
        orderBy:{createdAt:"desc"}
    })
}

export const ideaservice ={
    getAllIdeas,
    getIdeaById,
  getSearchSuggestions,
  getPersonalRecommendations,
  getTrendingRecommendations,
  getRecommendationClickAnalytics,
  trackIdeaInteraction,
    createIdea,
    submitIdea,
    uPdateIdea,
    deleteIdea,
    getmyIdeas
}
