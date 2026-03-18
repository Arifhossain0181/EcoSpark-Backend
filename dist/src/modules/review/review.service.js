import { prisma } from "../../config/Prisma";
export const addreview = async (ideaId, userId, rating, comment) => {
    const existing = await prisma.review.findFirst({
        where: {
            ideaId,
            userId,
        },
    });
    if (existing) {
        throw new Error("You have already reviewed this idea");
    }
    return await prisma.review.create({
        data: {
            ideaId,
            userId,
            rating,
            comment,
        },
    });
};
export const uPdateReview = async (id, userId, data) => {
    const review = await prisma.review.findUniqueOrThrow({
        where: { id },
    });
    if (!review) {
        throw new Error("Review not found");
    }
    if (review.userId !== userId) {
        throw new Error("You can only update your own review");
    }
    return await prisma.review.update({
        where: { id },
        data,
    });
};
export const deleteReview = async (id, userId) => {
    const review = await prisma.review.findUniqueOrThrow({
        where: { id },
    });
    if (!review) {
        throw new Error("Review not found");
    }
    if (review.userId !== userId) {
        throw new Error("You can only delete your own review");
    }
    return await prisma.review.delete({
        where: { id },
    });
};
