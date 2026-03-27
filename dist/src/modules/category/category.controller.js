import { createCategory, getCategories, deleteCategory, updateCategory } from "./category.service";
export const createCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }
        const result = await createCategory(name);
        return res.status(201).json({
            success: true,
            data: result,
            message: "Category created successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create category",
        });
    }
};
export const getAllCategoriesController = async (req, res) => {
    try {
        const result = await getCategories();
        return res.status(200).json({
            success: true,
            data: result,
            message: "Categories fetched successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch categories",
        });
    }
};
export const deleteCategoryController = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await deleteCategory(id);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete category",
        });
    }
};
export const updateCategoryController = async (req, res) => {
    try {
        const id = req.params.id;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }
        const result = await updateCategory(id, name);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Category updated successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update category",
        });
    }
};
