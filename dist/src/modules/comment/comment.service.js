import { prisma } from "../../config/Prisma";
export const getcomments = async (ideaId) => {
    const allComments = await prisma.comment.findMany({
        where: { ideaId },
        include: {
            user: {
                select: {
                    name: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    const byParent = new Map();
    for (const item of allComments) {
        const key = item.parentId ?? null;
        const list = byParent.get(key) ?? [];
        list.push({ ...item, replies: [] });
        byParent.set(key, list);
    }
    const buildTree = (parentId) => {
        const nodes = byParent.get(parentId) ?? [];
        for (const node of nodes) {
            node.replies = buildTree(node.id);
        }
        return nodes;
    };
    return buildTree(null).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
export const getAllCommentsForAdmin = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                idea: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        prisma.comment.count(),
    ]);
    return {
        comments,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
};
