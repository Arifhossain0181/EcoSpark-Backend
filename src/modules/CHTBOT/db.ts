import { prisma } from '../../config/Prisma';

export type ProjectSnapshot = {
  counts: {
    users: number;
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
    totalPayments: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    paidPurchases: number;
    totalSpent: number;
    purchasedPaidIdeas: number;
    createdIdeasCount: number;
    createdPaidIdeasCount: number;
    commentsCount: number;
    reviewsCount: number;
    votesCount: number;
    watchlistCount: number;
    latestCreatedIdeas: Array<{ title: string; status: string; isPaid: boolean }>;
    latestPayments: Array<{ amount: number; status: string; createdAt: Date; ideaTitle: string }>;
    latestPurchasedIdeas: string[];
    preferredCategories: string[];
  };
};

export async function getProjectSnapshot(message: string, userId?: string): Promise<ProjectSnapshot> {
  const keyword = message.trim();

  const [
    userCount,
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
    userCreatedIdeas,
    userPaymentHistory,
    userPayments,
    userCommentsCount,
    userReviewsCount,
    userVotesCount,
    userWatchlistCount,
    userWatchlist,
  ] = await Promise.all([
    prisma.user.count(),
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
      ? prisma.idea.findMany({
          where: { authorId: userId },
          select: {
            title: true,
            status: true,
            isPaid: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        })
      : Promise.resolve([]),
    userId
      ? prisma.payment.findMany({
          where: { userId },
          select: {
            amount: true,
            status: true,
            createdAt: true,
            idea: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        })
      : Promise.resolve([]),
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
                id: true,
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
        })
      : Promise.resolve([]),
    userId ? prisma.comment.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.review.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.vote.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.watchlist.count({ where: { userId } }) : Promise.resolve(0),
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
  const totalPayments = userPaymentHistory.length;
  const successfulPayments = userPaymentHistory.filter((payment) => payment.status === 'SUCCESS').length;
  const pendingPayments = userPaymentHistory.filter((payment) => payment.status === 'PENDING').length;
  const failedPayments = userPaymentHistory.filter((payment) => payment.status === 'FAILED').length;
  const createdIdeasCount = userCreatedIdeas.length;
  const createdPaidIdeasCount = userCreatedIdeas.filter((idea) => idea.isPaid).length;
  const totalSpent = userPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const preferredCategorySet = new Set<string>([
    ...userPayments.map((payment) => payment.idea.category.name),
    ...userWatchlist.map((watchItem) => watchItem.idea.category.name),
  ]);
  const preferredCategories = Array.from(preferredCategorySet).slice(0, 6);

  return {
    counts: {
      users: userCount,
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
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      paidPurchases: userPayments.length,
      totalSpent,
      purchasedPaidIdeas,
      createdIdeasCount,
      createdPaidIdeasCount,
      commentsCount: userCommentsCount,
      reviewsCount: userReviewsCount,
      votesCount: userVotesCount,
      watchlistCount: userWatchlistCount,
      latestCreatedIdeas: userCreatedIdeas,
      latestPayments: userPaymentHistory.map((payment) => ({
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        ideaTitle: payment.idea.title,
      })),
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
    `Counts -> users: ${snapshot.counts.users}, categories: ${snapshot.counts.categories}, ideas/projects: ${snapshot.counts.ideas}, free ideas: ${snapshot.counts.freeIdeas}, paid ideas: ${snapshot.counts.paidIdeas}, approved ideas: ${snapshot.counts.approvedIdeas}, comments: ${snapshot.counts.comments}, reviews: ${snapshot.counts.reviews}, votes: ${snapshot.counts.votes}, payments: ${snapshot.counts.payments}, watchlist: ${snapshot.counts.watchlist}.`
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
      `Current user activity -> successful payments: ${snapshot.user.paidPurchases}, purchased paid ideas: ${snapshot.user.purchasedPaidIdeas}, comments: ${snapshot.user.commentsCount}, reviews: ${snapshot.user.reviewsCount}, votes: ${snapshot.user.votesCount}, watchlist: ${snapshot.user.watchlistCount}, total spent: ${snapshot.user.totalSpent}.`
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
