import { prisma } from '../../config/Prisma';

export async function getContextFromDB(message: string): Promise<string> {
  const keyword = message.trim();

  const [
    categoryCount,
    ideaCount,
    commentCount,
    reviewCount,
    voteCount,
    paymentCount,
    watchlistCount,
    matchedCategories,
    matchedIdeas,
    latestIdeas,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.idea.count(),
    prisma.comment.count(),
    prisma.review.count(),
    prisma.vote.count(),
    prisma.payment.count(),
    prisma.watchlist.count(),
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
      take: 6,
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
      take: 5,
    }),
  ]);

  const lines: string[] = [];

  lines.push('EcoSpark database snapshot (user profile data excluded):');
  lines.push(
    `Counts -> categories: ${categoryCount}, ideas/projects: ${ideaCount}, comments: ${commentCount}, reviews: ${reviewCount}, votes: ${voteCount}, payments: ${paymentCount}, watchlist: ${watchlistCount}.`
  );

  if (matchedCategories.length > 0) {
    lines.push('Matched categories:');
    for (const category of matchedCategories) {
      lines.push(`- ${category.name} (ideas: ${category._count.ideas})`);
    }
  }

  if (matchedIdeas.length > 0) {
    lines.push('Matched ideas/projects:');
    for (const idea of matchedIdeas) {
      lines.push(
        `- ${idea.title} | category: ${idea.category.name} | status: ${idea.status} | paid: ${idea.isPaid ? `yes (${idea.price})` : 'no'} | comments: ${idea._count.comments}, votes: ${idea._count.votes}, reviews: ${idea._count.reviews}, payments: ${idea._count.payments}`
      );
    }
  } else {
    lines.push('No direct idea/project match found for this query.');
  }

  if (latestIdeas.length > 0) {
    lines.push('Latest ideas/projects in platform:');
    for (const idea of latestIdeas) {
      lines.push(`- ${idea.title} | ${idea.category.name} | status: ${idea.status}`);
    }
  }

  return lines.join('\n');
}
