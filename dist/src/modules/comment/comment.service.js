import { prisma } from "../../config/Prisma";
export const getcomments = async (ideaId) => {
    return await prisma.comment.findMany({
        where: { ideaId, parentId: null },
        include: {
            user: {
                select: {
                    name: true,
                    avatar: true,
                },
            },
            replies: {
                include: {
                    user: {
                        select: {
                            name: true,
                            avatar: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
export const addComment = async (ideaId, userId, text, parentId) => {
    const comment = await prisma.comment.create({
        data: {
            text,
            userId,
            ideaId,
            parentId: parentId || null,
        },
        include: {
            user: {
                select: {
                    name: true,
                    avatar: true,
                },
            },
        },
    });
    return comment;
};
export const deleteComment = async (commentId, userId, role) => {
    const commentfind = await prisma.comment.findUnique({
        where: { id: commentId }
    });
    if (!commentfind) {
        throw new Error("Comment not found");
    }
    if (commentfind.userId !== userId && role !== "ADMIN") {
        throw new Error("Unauthorized");
    }
    await prisma.comment.delete({
        where: { id: commentId }
    });
};
