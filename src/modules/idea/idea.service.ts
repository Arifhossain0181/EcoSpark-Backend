import { IdeaQuery } from "../../tyPes";

import { prisma } from "../../config/Prisma";
import { Status } from "../../generated/prisma/enums";

export const getAllIdeas = async (query: IdeaQuery) => {
	const { search, category, isPaid, sort, page = "1", limit = "10" } = query;

	const where: any = { status: Status.APPROVED };
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

	const [ideas, total] = await Promise.all([
		prisma.idea.findMany({
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
		}),
		prisma.idea.count({ where }),
	]);
	return {
		ideas,
		total,
		page: Math.ceil(total / parseInt(limit)),
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
  return await prisma.idea.create({
    data: {
      ...data,
      authorId,
      status: Status.DRAFT,
      images: data.images ?? (data.image ? [data.image] : []),
    },
  });
};
export const submitIdea = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== userId) throw new Error("Unauthorized");
  if (idea.status !== Status.DRAFT && idea.status !== Status.REJECTED)
    throw new Error("Only draft or rejected ideas can be submitted");
  return await prisma.idea.update({
    where: { id },
    data: { status: Status.UNDER_REVIEW },
  });
};
export const uPdateIdea = async (id: string, data: any, userId: string) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== userId) throw new Error("Unauthorized");
    if (idea.status !== Status.DRAFT && idea.status !== Status.REJECTED)
			throw new Error("Only draft or rejected ideas can be updated");
    return await prisma.idea.update({
      where: { id },
      data
    });
}
export const deleteIdea = async (id: string, userId: string ,role: string) => {
    const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== userId && role !== "ADMIN") throw new Error("Unauthorized");
    return await prisma.idea.delete({
      where: { id },
    });


}
export const getmyIdeas = async(authorId:string)=>{
    return await prisma.idea.findMany({
        where:{authorId},
        include:{
            category:true,
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
