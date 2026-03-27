import { prisma } from "../../config/Prisma";
import { Status } from "../../generated/prisma/enums";

export const getAllIdeas = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
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
    orderBy: {
      createdAt: "desc",
    },
      skip,
      take: limit,
    }),
    prisma.idea.count(),
  ]);

  return {
    ideas,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const approveIdea = async (id: string) => {
  const idea = await prisma.idea.update({
    where: { id },
    data: {
      status: Status.APPROVED,
      adminFeedback: "Approved by admin",
    },
  });

  return idea;
};

export const rejectIdea = async (id: string, feedback: string) => {
  const idea = await prisma.idea.update({
    where: { id },
    data: {
      status: Status.REJECTED,
      adminFeedback: feedback,
    },
  });

  return idea;
};

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          ideas: true,
        },
      },
    },
  });

  return users;
};

export const updateUser = async (
  id: string,
  data:any,
) => {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return user;
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.delete({
    where: { id },
  });

  return user;
};

export const getDashboardStats = async () => {
  const [totalIdeas, totalUsers, pendingIdeas, approvedIdeas, rejectedIdeas] =
    await Promise.all([
      prisma.idea.count(),
      prisma.user.count(),
      prisma.idea.count({ where: { status: Status.UNDER_REVIEW } }),
      prisma.idea.count({ where: { status: Status.APPROVED } }),
      prisma.idea.count({ where: { status: Status.REJECTED } }),
    ]);

  return {
    totalIdeas,
    totalUsers,
    pendingIdeas,
    approvedIdeas,
    rejectedIdeas,
  };
};
