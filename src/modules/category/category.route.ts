import { Router } from "express";
import { authMiddleware, adminOrManager } from "../../middleware/auth.middleware";
import {
	createCategoryController,
	getAllCategoriesController,
	deleteCategoryController,
	updateCategoryController,
} from "./category.controller";

const router = Router();

// Create category (admin/manager)
router.post("/", authMiddleware, adminOrManager, createCategoryController);

// Get all categories (public)
router.get("/", getAllCategoriesController);

// Delete category (admin/manager)
router.delete("/:id", authMiddleware, adminOrManager, deleteCategoryController);

// Update category (admin/manager)
router.patch("/:id", authMiddleware, adminOrManager, updateCategoryController);

export default router;
