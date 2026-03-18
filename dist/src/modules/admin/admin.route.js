import express from "express";
import { getAllIdeasController, approveIdeaController, rejectIdeaController, getAllUsersController, updateUserController, deleteUserController, dashboardStatsController } from "./admin.controller";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware";
const router = express.Router();
//  Dashboard (admin only)
router.get("/dashboard", authMiddleware, adminOnly, dashboardStatsController);
//  Ideas management (admin only)
router.get("/ideas", authMiddleware, adminOnly, getAllIdeasController);
router.patch("/ideas/:id/approve", authMiddleware, adminOnly, approveIdeaController);
router.patch("/ideas/:id/reject", authMiddleware, adminOnly, rejectIdeaController);
//  Users management (admin only)
router.get("/users", authMiddleware, adminOnly, getAllUsersController);
router.patch("/users/:id", authMiddleware, adminOnly, updateUserController);
router.delete("/users/:id", authMiddleware, adminOnly, deleteUserController);
export default router;
