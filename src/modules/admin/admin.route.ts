
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
import {  authMiddleware } from "../../middleware/auth.middleware";



const router = express.Router();

//  Dashboard
router.get("/dashboard", authMiddleware, dashboardStatsController);

//  Ideas management
router.get("/ideas", authMiddleware, getAllIdeasController);
router.patch("/ideas/:id/approve", authMiddleware, approveIdeaController);
router.patch("/ideas/:id/reject", authMiddleware, rejectIdeaController);

//  Users management
router.get("/users", authMiddleware, getAllUsersController);
router.patch("/users/:id", authMiddleware, updateUserController);
router.delete("/users/:id", authMiddleware, deleteUserController);

export default router;