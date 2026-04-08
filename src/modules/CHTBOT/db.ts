import { prisma } from '../../config/Prisma';

export type ProjectSnapshot = {
  counts: {
    categories: number;
    ideas: number;
    freeIdeas: number;
    paidIdeas: number;
    approvedIdeas: number;
    comments: number;
    reviews: number;
    votes: number;
    payments: number;
    watchlist: number;
  };
  categories: Array<{ id: string; name: string; ideasCount: number }>;
  matchedCategories: Array<{ id: string; name: string; ideasCount: number }>;
  matchedIdeas: Array<{
    id: string;
    title: string;
    status: string;
    isPaid: boolean;
    price: number;
    category: string;
    comments: number;
    votes: number;
    reviews: number;
    payments: number;
  }>;
  latestIdeas: Array<{ title: string; status: string; category: string }>;
  freeIdeaSamples: Array<{ title: string; category: string }>;
  paidIdeaSamples: Array<{ title: string; category: string; price: number }>;
  user: {
    id: string | null;
    paidPurchases: number;
    totalSpent: number;
    purchasedPaidIdeas: number;
    latestPurchasedIdeas: string[];
    preferredCategories: string[];
  };
};

export async function getProjectSnapshot(message: string, userId?: string): Promise<ProjectSnapshot> {
  const keyword = message.trim();

  const [
    categoryCount,
    ideaCount,
    freeIdeaCount,
    paidIdeaCount,
    approvedIdeaCount,
    commentCount,
    reviewCount,
    voteCount,
    paymentCount,
    watchlistCount,
    categories,
    matchedCategories,
    matchedIdeas,
    latestIdeas,
    freeIdeaSamples,
    paidIdeaSamples,
    userPayments,
    userWatchlist,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { isPaid: false } }),
    prisma.idea.count({ where: { isPaid: true } }),
    prisma.idea.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count(),
    prisma.review.count(),
    prisma.vote.count(),
    prisma.payment.count(),
    prisma.watchlist.count(),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ideas: true,
          },
        },
      },
      take: 12,
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.category.findMany({
      where: {
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ideas: true,
          },
        },
      },
      take: 5,
    }),
    prisma.idea.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { problem: { contains: keyword, mode: 'insensitive' } },
          { solution: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { category: { name: { contains: keyword, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        isPaid: true,
        price: true,
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
            reviews: true,
            payments: true,
          },
        },
      },
      take: 8,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.idea.findMany({
      select: {
        title: true,
        status: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    }),
    prisma.idea.findMany({
      where: {
        isPaid: false,
        status: 'APPROVED',
      },
      select: {
        title: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    }),
    prisma.idea.findMany({
      where: {
        isPaid: true,
        status: 'APPROVED',
      },
      select: {
        title: true,
        price: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    }),
    userId
      ? prisma.payment.findMany({
          where: {
            userId,
            status: 'SUCCESS',
          },
          select: {
            amount: true,
            idea: {
              select: {
                title: true,
                isPaid: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 8,
        })
      : Promise.resolve([]),
    userId
      ? prisma.watchlist.findMany({
          where: { userId },
          select: {
            idea: {
              select: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const purchasedPaidIdeas = userPayments.filter((payment) => payment.idea.isPaid).length;
  const totalSpent = userPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const preferredCategorySet = new Set<string>([
    ...userPayments.map((payment) => payment.idea.category.name),
    ...userWatchlist.map((watchItem) => watchItem.idea.category.name),
  ]);
  const preferredCategories = Array.from(preferredCategorySet).slice(0, 6);

  return {
    counts: {
      categories: categoryCount,
      ideas: ideaCount,
      freeIdeas: freeIdeaCount,
      paidIdeas: paidIdeaCount,
      approvedIdeas: approvedIdeaCount,
      comments: commentCount,
      reviews: reviewCount,
      votes: voteCount,
      payments: paymentCount,
      watchlist: watchlistCount,
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      ideasCount: category._count.ideas,
    })),
    matchedCategories: matchedCategories.map((category) => ({
      id: category.id,
      name: category.name,
      ideasCount: category._count.ideas,
    })),
    matchedIdeas: matchedIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      status: idea.status,
      isPaid: idea.isPaid,
      price: idea.price,
      category: idea.category.name,
      comments: idea._count.comments,
      votes: idea._count.votes,
      reviews: idea._count.reviews,
      payments: idea._count.payments,
    })),
    latestIdeas: latestIdeas.map((idea) => ({
      title: idea.title,
      status: idea.status,
      category: idea.category.name,
    })),
    freeIdeaSamples: freeIdeaSamples.map((idea) => ({
      title: idea.title,
      category: idea.category.name,
    })),
    paidIdeaSamples: paidIdeaSamples.map((idea) => ({
      title: idea.title,
      category: idea.category.name,
      price: idea.price,
    })),
    user: {
      id: userId || null,
      paidPurchases: userPayments.length,
      totalSpent,
      purchasedPaidIdeas,
      latestPurchasedIdeas: userPayments.map((payment) => payment.idea.title),
      preferredCategories,
    },
  };
}

export async function getContextFromDB(message: string, userId?: string): Promise<string> {
  const snapshot = await getProjectSnapshot(message, userId);

  const lines: string[] = [];

  lines.push('EcoSpark database snapshot (user profile data excluded):');
  lines.push(
    `Counts -> categories: ${snapshot.counts.categories}, ideas/projects: ${snapshot.counts.ideas}, free ideas: ${snapshot.counts.freeIdeas}, paid ideas: ${snapshot.counts.paidIdeas}, approved ideas: ${snapshot.counts.approvedIdeas}, comments: ${snapshot.counts.comments}, reviews: ${snapshot.counts.reviews}, votes: ${snapshot.counts.votes}, payments: ${snapshot.counts.payments}, watchlist: ${snapshot.counts.watchlist}.`
  );

  if (snapshot.categories.length > 0) {
    lines.push(`Available categories: ${snapshot.categories.map((category) => category.name).join(', ')}`);
  }

  if (snapshot.matchedCategories.length > 0) {
    lines.push('Matched categories:');
    for (const category of snapshot.matchedCategories) {
      lines.push(`- ${category.name} (ideas: ${category.ideasCount})`);
    }
  }

  if (snapshot.matchedIdeas.length > 0) {
    lines.push('Matched ideas/projects:');
    for (const idea of snapshot.matchedIdeas) {
      lines.push(
        `- ${idea.title} | category: ${idea.category} | status: ${idea.status} | paid: ${idea.isPaid ? `yes (${idea.price})` : 'no'} | comments: ${idea.comments}, votes: ${idea.votes}, reviews: ${idea.reviews}, payments: ${idea.payments}`
      );
    }
  } else {
    lines.push('No direct idea/project match found for this query.');
  }

  if (snapshot.latestIdeas.length > 0) {
    lines.push('Latest ideas/projects in platform:');
    for (const idea of snapshot.latestIdeas) {
      lines.push(`- ${idea.title} | ${idea.category} | status: ${idea.status}`);
    }
  }

  if (snapshot.freeIdeaSamples.length > 0) {
    lines.push(`Free idea samples: ${snapshot.freeIdeaSamples.map((idea) => `${idea.title} (${idea.category})`).join(', ')}`);
  }

  if (snapshot.paidIdeaSamples.length > 0) {
    lines.push(
      `Paid idea samples: ${snapshot.paidIdeaSamples
        .map((idea) => `${idea.title} (${idea.category}, ${idea.price})`)
        .join(', ')}`
    );
  }

  if (snapshot.user.id) {
    lines.push(
      `Current user purchases -> successful payments: ${snapshot.user.paidPurchases}, purchased paid ideas: ${snapshot.user.purchasedPaidIdeas}, total spent: ${snapshot.user.totalSpent}.`
    );
    if (snapshot.user.latestPurchasedIdeas.length > 0) {
      lines.push(`Current user latest purchased ideas: ${snapshot.user.latestPurchasedIdeas.join(', ')}`);
    }
    if (snapshot.user.preferredCategories.length > 0) {
      lines.push(`Current user preferred categories: ${snapshot.user.preferredCategories.join(', ')}`);
    }
  }

  return lines.join('\n');
}
