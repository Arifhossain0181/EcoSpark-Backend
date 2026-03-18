import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
	createCategoryController,
	getAllCategoriesController,
	deleteCategoryController,
} from "./category.controller";

const router = Router();

// Create category (protected, assume admin or authenticated user)
router.post("/", authMiddleware, createCategoryController);

// Get all categories (public)
router.get("/", getAllCategoriesController);

// Delete category (protected)
router.delete("/:id", authMiddleware, deleteCategoryController);

export default router;
