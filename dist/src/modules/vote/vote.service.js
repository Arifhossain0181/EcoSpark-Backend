import { prisma } from "../../config/Prisma";
export const castVote = async (ideaId, userId, type) => {
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
