
import { prisma } from "../../config/Prisma";

export const toggleWatchlist = async (ideaId: string, userId: string) => {
    const existing = await prisma.watchlist.findUnique({
        where: {
            userId_ideaId: {
                userId,
                ideaId,
            },
        },

    })
    if(existing){
        await prisma.watchlist.delete({
            where: { id: existing.id },
        });
        return { message: "Removed from watchlist" };
    } else {
        await prisma.watchlist.create({
            data: {
                userId,
                ideaId,
            },
        });
        return { message: "Added to watchlist" };
    }
}

export const getwatchlist = async (userId: string) => {
    const watchlist = await prisma.watchlist.findMany({
        where: { userId },
        include: {
            idea: {
                include:{
                    category:true
                }
            }
        }
    })
    return watchlist;

}