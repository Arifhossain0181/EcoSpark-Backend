import { Router } from "express";
import * as commentController from "./commet.controller";
import { adminOrManager, authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/admin/all", authMiddleware, adminOrManager, commentController.getAllCommentsAdmin);
router.get("/:ideaId", commentController.getComments);
router.post("/:ideaId", authMiddleware, commentController.addComment);
router.delete("/:id", authMiddleware, commentController.deleteComment);

export default router;
