import { prisma } from "../../config/Prisma";
import { Status } from "../../generated/prisma/enums";
const createHttpError = (message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
};
export const getAllIdeas = async (query) => {
    const { search, category, isPaid, sort, page = "1", limit = "10", includeTotal = "true", } = query;
    const where = {
        status: Status.APPROVED,
    };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }
    if (category) {
        where.category = { name: category };
    }
    if (isPaid) {
        where.isPaid = isPaid === "true";
    }
    const orderBy = sort === "recent"
        ? { createdAt: "desc" }
        : sort === "top"
            ? { votes: { _count: "desc" } }
            : sort === "commented"
                ? { comments: { _count: "desc" } }
                : { createdAt: "desc" };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const shouldIncludeTotal = includeTotal !== "false";
    const ideas = await prisma.idea.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
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
    });
    const total = shouldIncludeTotal
        ? await prisma.idea.count({ where })
        : ideas.length;
    return {
        ideas,
        total,
        page: shouldIncludeTotal ? Math.ceil(total / parseInt(limit)) : 1,
        limit: parseInt(limit),
    };
};
export const getIdeaById = async (id) => {
    const idea = await prisma.idea.findUniqueOrThrow({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
            category: true,
            _count: {
                select: {
                    votes: true,
                    comments: true,
                },
            },
            votes: {
                select: {
                    userId: true,
                    type: true,
                },
            },
            reviews: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
    if (!idea)
        throw new Error("Idea not found");
    return idea;
};
export const createIdea = async (data, authorId) => {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const problem = typeof data.problem === "string" ? data.problem.trim() : "";
    const solution = typeof data.solution === "string" ? data.solution.trim() : "";
    const description = typeof data.description === "string" ? data.description.trim() : "";
    const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
    if (!title || !problem || !solution || !description || !categoryId) {
        throw createHttpError("title, problem, solution, description and categoryId are required", 400);
    }
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        throw createHttpError("Invalid categoryId", 400);
    }
    const normalizedImages = Array.isArray(data.images)
        ? data.images.filter((img) => typeof img === "string" && img.trim() !== "")
        : typeof data.image === "string" && data.image.trim()
            ? [data.image.trim()]
            : [];
    const isPaid = Boolean(data.isPaid);
    const price = Number(data.price ?? 0);
    if (isPaid && (!Number.isFinite(price) || price <= 0)) {
        throw createHttpError("Paid ideas must have a valid price greater than 0", 400);
    }
    return await prisma.idea.create({
        data: {
            title,
            problem,
            solution,
            description,
            categoryId,
            isPaid,
            price: isPaid ? price : 0,
            authorId,
            status: Status.DRAFT,
            images: normalizedImages,
        },
    });
};
export const submitIdea = async (id, userId) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea)
        throw new Error("Idea not found");
    if (idea.authorId !== userId)
        throw new Error("Unauthorized");
    if (idea.status !== Status.DRAFT && idea.status !== Status.REJECTED)
        throw new Error("Only draft or rejected ideas can be submitted");
    return await prisma.idea.update({
        where: { id },
        data: { status: Status.UNDER_REVIEW },
    });
};
export const uPdateIdea = async (id, data, userId) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea)
        throw new Error("Idea not found");
    if (idea.authorId !== userId)
        throw new Error("Unauthorized");
    if (idea.status !== Status.DRAFT && idea.status !== Status.REJECTED)
        throw new Error("Only draft or rejected ideas can be updated");
    return await prisma.idea.update({
        where: { id },
        data
    });
};
export const deleteIdea = async (id, userId, role) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea)
        throw new Error("Idea not found");
    if (idea.authorId !== userId && role !== "ADMIN")
        throw new Error("Unauthorized");
    return await prisma.idea.delete({
        where: { id },
    });
};
export const getmyIdeas = async (authorId) => {
    return await prisma.idea.findMany({
        where: { authorId },
        include: {
            category: true,
            _count: {
                select: {
                    votes: true,
                    comments: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};
export const ideaservice = {
    getAllIdeas,
    getIdeaById,
    createIdea,
    submitIdea,
    uPdateIdea,
    deleteIdea,
    getmyIdeas
};
