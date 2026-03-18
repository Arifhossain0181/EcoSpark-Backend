import { prisma } from "../../config/Prisma";
export const createCategory = async (name) => {
    return await prisma.category.create({
        data: { name },
    });
};
export const getCategories = async () => {
    return await prisma.category.findMany();
};
export const deleteCategory = async (id) => {
    return await prisma.category.delete({
        where: { id },
    });
};
