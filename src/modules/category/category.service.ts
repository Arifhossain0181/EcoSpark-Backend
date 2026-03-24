
import { prisma } from "../../config/Prisma";

export const createCategory = async (name: string) => {
	return await prisma.category.create({
		data: { name },
	});
};

export const getCategories = async () => {
	return await prisma.category.findMany({
		include: {
			_count: {
				select: {
					ideas: true,
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});
};

export const deleteCategory = async (id: string) => {
	return await prisma.category.delete({
		where: { id },
	});
};

export const updateCategory = async (id: string, name: string) => {
	return await prisma.category.update({
		where: { id },
		data: { name },
	});
};