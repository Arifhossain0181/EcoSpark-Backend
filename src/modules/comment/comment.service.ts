import { prisma } from "../../config/Prisma";
export const getcomments = async (ideaId: string) => {
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

    type CommentNode = (typeof allComments)[number] & { replies: CommentNode[] };

    const byParent = new Map<string | null, CommentNode[]>();

    for (const item of allComments) {
        const key = item.parentId ?? null;
        const list = byParent.get(key) ?? [];
        list.push({ ...item, replies: [] });
        byParent.set(key, list);
    }

    const buildTree = (parentId: string | null): CommentNode[] => {
        const nodes = byParent.get(parentId) ?? [];
        for (const node of nodes) {
            node.replies = buildTree(node.id);
        }
        return nodes;
    };

    return buildTree(null).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
};

export const addComment = async (
    ideaId: string,
    userId: string,
    text: string,
    parentId?: string
) => {
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
export const deleteComment = async (commentId: string, userId: string ,role: string) => {
    const commentfind = await prisma.comment.findUnique({
        where:{ id: commentId }

    })
    if(!commentfind){
        throw new Error("Comment not found");
    }
    if(commentfind.userId !== userId && role !== "ADMIN" && role !== "MANAGER"){
        throw new Error("Unauthorized");
    }
    await prisma.comment.delete({
        where:{ id: commentId }
    })
}

type AdminCommentFilters = {
    search?: string;
    type?: "MAIN" | "REPLY";
};

const buildCommentWhere = (filters: AdminCommentFilters) => {
    const search = filters.search?.trim();
    const where: Record<string, unknown> = {};

    if (filters.type === "MAIN") {
        where.parentId = null;
    } else if (filters.type === "REPLY") {
        where.parentId = { not: null };
    }

    if (search) {
        where.OR = [
            { text: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { idea: { title: { contains: search, mode: "insensitive" } } },
        ];
    }

    return where;
};

export const getAllCommentsForAdmin = async (page = 1, limit = 10, filters: AdminCommentFilters = {}) => {
    const skip = (page - 1) * limit;
    const where = buildCommentWhere(filters);

    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
        where,
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
        prisma.comment.count({ where }),
    ]);

    return {
        comments,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}