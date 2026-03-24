import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware";
import {
	createCategoryController,
	getAllCategoriesController,
	deleteCategoryController,
	updateCategoryController,
} from "./category.controller";

const router = Router();

// Create category (admin only)
router.post("/", authMiddleware, adminOnly, createCategoryController);

// Get all categories (public)
router.get("/", getAllCategoriesController);

// Delete category (admin only)
router.delete("/:id", authMiddleware, adminOnly, deleteCategoryController);

// Update category (admin only)
router.patch("/:id", authMiddleware, adminOnly, updateCategoryController);

export default router;
