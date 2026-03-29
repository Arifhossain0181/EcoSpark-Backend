import { IdeaQuery } from "../../tyPes";

import { prisma } from "../../config/Prisma";
import { Status } from "../../generated/prisma/enums";
import { PaymentStatus } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

const createHttpError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
};

export const getAllIdeas = async (query: IdeaQuery) => {
  const {
    search,
    category,
    isPaid,
    sort,
    page = "1",
    limit = "10",
    includeTotal = "true",
  } = query;

  const where: any = {
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
  const orderBy: any =
		sort === "recent"
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

export const getIdeaById = async (id: string) => {
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

  if (!idea) throw new Error("Idea not found");
  return idea;
};
export const createIdea = async (data: any, authorId: string) => {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const problem = typeof data.problem === "string" ? data.problem.trim() : "";
  const solution = typeof data.solution === "string" ? data.solution.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const categoryId =
    typeof data.categoryId === "string" ? data.categoryId.trim() : "";

  if (!title || !problem || !solution || !description || !categoryId) {
    throw createHttpError(
      "title, problem, solution, description and categoryId are required",
      400
    );
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw createHttpError("Invalid categoryId", 400);
  }

  const normalizedImages = Array.isArray(data.images)
    ? data.images.filter((img: unknown) => typeof img === "string" && img.trim() !== "")
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
export const submitIdea = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== userId) throw new Error("Unauthorized");
  if (
    idea.status !== Status.DRAFT &&
    idea.status !== Status.REJECTED &&
    idea.status !== Status.APPROVED
  ) {
    throw new Error("Only draft, rejected, or approved ideas can be submitted");
  }
  return await prisma.idea.update({
    where: { id },
    data: { status: Status.UNDER_REVIEW },
  });
};
export const uPdateIdea = async (id: string, data: any, userId: string) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== userId) throw createHttpError("Unauthorized", 403);

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const problem = typeof data.problem === "string" ? data.problem.trim() : "";
    const solution = typeof data.solution === "string" ? data.solution.trim() : "";
    const description =
      typeof data.description === "string" ? data.description.trim() : "";
    const categoryId =
      typeof data.categoryId === "string" ? data.categoryId.trim() : "";

    if (!title || !problem || !solution || !description || !categoryId) {
      throw createHttpError(
        "title, problem, solution, description and categoryId are required",
        400
      );
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw createHttpError("Invalid categoryId", 400);
    }

    if (idea.isPaid) {
      const successfulPaymentCount = await prisma.payment.count({
        where: {
          ideaId: id,
          status: PaymentStatus.SUCCESS,
        },
      });

      if (successfulPaymentCount > 0) {
        throw createHttpError(
          "This paid idea already has successful payments and cannot be edited",
          400
        );
      }
    }

    const normalizedImages = Array.isArray(data.images)
      ? data.images.filter((img: unknown) => typeof img === "string" && img.trim() !== "")
      : [];

    const isPaid = Boolean(data.isPaid);
    const price = Number(data.price ?? 0);
    if (isPaid && (!Number.isFinite(price) || price <= 0)) {
      throw createHttpError("Paid ideas must have a valid price greater than 0", 400);
    }

    const nextStatus =
      idea.status === Status.APPROVED ? Status.UNDER_REVIEW : idea.status;

    return await prisma.idea.update({
      where: { id },
      data: {
        title,
        problem,
        solution,
        description,
        categoryId,
        isPaid,
        price: isPaid ? price : 0,
        images: normalizedImages,
        status: nextStatus,
      }
    });
}
export const deleteIdea = async (id: string, userId: string ,role: string) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== userId && role !== "ADMIN") {
      throw createHttpError("Unauthorized", 403);
    }

    if (idea.isPaid) {
      const successfulPaymentCount = await prisma.payment.count({
        where: {
          ideaId: id,
          status: PaymentStatus.SUCCESS,
        },
      });

      if (successfulPaymentCount > 0) {
        throw createHttpError(
          "This paid idea already has successful payments and cannot be deleted",
          400
        );
      }
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Remove dependent rows first to satisfy FK constraints.
        await tx.vote.deleteMany({ where: { ideaId: id } });
        await tx.review.deleteMany({ where: { ideaId: id } });
        await tx.watchlist.deleteMany({ where: { ideaId: id } });
        await tx.payment.deleteMany({ where: { ideaId: id } });

        // Self-referencing comments must be deleted children-first.
        await tx.comment.deleteMany({
          where: {
            ideaId: id,
            parentId: { not: null },
          },
        });
        await tx.comment.deleteMany({
          where: {
            ideaId: id,
            parentId: null,
          },
        });

        return tx.idea.delete({ where: { id } });
      });
    } catch (error) {
      const err = error as Prisma.PrismaClientKnownRequestError;

      // Fallback for environments where stale constraints still block delete.
      if (err.code === "P2003") {
        return await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe('DELETE FROM "Vote" WHERE "ideaId" = $1', id);
          await tx.$executeRawUnsafe('DELETE FROM "Review" WHERE "ideaId" = $1', id);
          await tx.$executeRawUnsafe('DELETE FROM "Watchlist" WHERE "ideaId" = $1', id);
          await tx.$executeRawUnsafe('DELETE FROM "Payment" WHERE "ideaId" = $1', id);

          await tx.comment.deleteMany({
            where: {
              ideaId: id,
              parentId: { not: null },
            },
          });
          await tx.comment.deleteMany({
            where: {
              ideaId: id,
              parentId: null,
            },
          });

          return tx.idea.delete({ where: { id } });
        });
      }

      throw error;
    }


}
export const getmyIdeas = async(authorId:string)=>{
    return await prisma.idea.findMany({
        where:{authorId},
        include:{
            category:true,
            payments: {
              where: {
                status: PaymentStatus.SUCCESS,
              },
              select: {
                id: true,
              },
              take: 1,
            },
            _count:{
                select:{
	                votes:true,
                    comments:true
                }
            }

        },
        orderBy:{createdAt:"desc"}
    })
}

export const ideaservice ={
    getAllIdeas,
    getIdeaById,
    createIdea,
    submitIdea,
    uPdateIdea,
    deleteIdea,
    getmyIdeas
}
