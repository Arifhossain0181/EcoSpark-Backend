
import express from "express";
import {
  getAllIdeasController,
  approveIdeaController,
  rejectIdeaController,
  getAllUsersController,
  updateUserController,
  deleteUserController,
   dashboardStatsController
} from "./admin.controller";
import { authMiddleware, adminOnly, adminOrManager } from "../../middleware/auth.middleware";



const router = express.Router();

//  Dashboard (admin/manager)
router.get("/dashboard", authMiddleware, adminOrManager, dashboardStatsController);

//  Ideas management (admin/manager)
router.get("/ideas", authMiddleware, adminOrManager, getAllIdeasController);
router.patch("/ideas/:id/approve", authMiddleware, adminOrManager, approveIdeaController);
router.patch("/ideas/:id/reject", authMiddleware, adminOrManager, rejectIdeaController);

//  Users management (admin only)
router.get("/users", authMiddleware, adminOnly, getAllUsersController);
router.patch("/users/:id", authMiddleware, adminOnly, updateUserController);
router.delete("/users/:id", authMiddleware, adminOnly, deleteUserController);

export default router;