import { prisma } from "../../config/Prisma";
import { VoteType } from "../../generated/prisma/enums";

export const castVote = async (
  ideaId: string,
  userId: string,
  type: VoteType,
) => {
  const existing = await prisma.vote.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
    },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({
        where: { id: existing.id },
      });
      return { message: "Vote removed successfully" };
    }

    return await prisma.vote.update({
      where: { id: existing.id },
      data: { type },
    });
  }

  return await prisma.vote.create({
    data: {
      ideaId,
      userId,
      type,
    },
  });
};
