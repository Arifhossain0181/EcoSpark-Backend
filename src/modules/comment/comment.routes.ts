import { Router } from "express";
import * as commentController from "./commet.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/:ideaId", commentController.getComments);
router.post("/:ideaId", authMiddleware, commentController.addComment);
router.delete("/:id", authMiddleware, commentController.deleteComment);

export default router;
