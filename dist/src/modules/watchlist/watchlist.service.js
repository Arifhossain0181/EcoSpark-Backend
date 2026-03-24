import { prisma } from "../../config/Prisma";
export const toggleWatchlist = async (ideaId, userId) => {
    const existing = await prisma.watchlist.findUnique({
        where: {
            userId_ideaId: {
                userId,
                ideaId,
            },
        },
    });
    if (existing) {
        await prisma.watchlist.delete({
            where: { id: existing.id },
        });
        return { message: "Removed from watchlist" };
    }
    try {
        await prisma.watchlist.create({
            data: {
                userId,
                ideaId,
            },
        });
        return { message: "Added to watchlist" };
    }
    catch (error) {
        const err = error;
        // Handle rare race condition: record created between findUnique and create
        if (err.code === "P2002") {
            const again = await prisma.watchlist.findUnique({
                where: {
                    userId_ideaId: {
                        userId,
                        ideaId,
                    },
                },
            });
            if (again) {
                await prisma.watchlist.delete({ where: { id: again.id } });
                return { message: "Removed from watchlist" };
            }
        }
        throw error;
    }
};
export const getwatchlist = async (userId) => {
    const watchlist = await prisma.watchlist.findMany({
        where: { userId },
        include: {
            idea: {
                include: {
                    category: true
                }
            }
        }
    });
    return watchlist;
};
