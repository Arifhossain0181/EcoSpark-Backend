import { Request, Response } from "express";
import { AuthRequest } from "../../tyPes";
import { createCategory, getCategories, deleteCategory, updateCategory } from "./category.service";

export const createCategoryController = async (req: AuthRequest, res: Response) => {
	try {
		const { name } = req.body as { name?: string };
		if (!name) {
			return res.status(400).json({ success: false, message: "Name is required" });
		}
		const result = await createCategory(name);
		return res.status(201).json({
			success: true,
			data: result,
			message: "Category created successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: (error as Error).message || "Failed to create category",
		});
	}
};

export const getAllCategoriesController = async (req: Request, res: Response) => {
	try {
		const result = await getCategories();
		return res.status(200).json({
			success: true,
			data: result,
			message: "Categories fetched successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: (error as Error).message || "Failed to fetch categories",
		});
	}
};

export const deleteCategoryController = async (req: AuthRequest, res: Response) => {
	try {
		const id = req.params.id as string;
		const result = await deleteCategory(id);
		return res.status(200).json({
			success: true,
			data: result,
			message: "Category deleted successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: (error as Error).message || "Failed to delete category",
		});
	}
};

export const updateCategoryController = async (req: AuthRequest, res: Response) => {
	try {
		const id = req.params.id as string;
		const { name } = req.body as { name?: string };

		if (!name) {
			return res.status(400).json({ success: false, message: "Name is required" });
		}

		const result = await updateCategory(id, name);
		return res.status(200).json({
			success: true,
			data: result,
			message: "Category updated successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: (error as Error).message || "Failed to update category",
		});
	}
};
