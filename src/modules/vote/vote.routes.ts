import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as voteController from "./vote.controller";

const router = Router();

// Toggle or change a vote on an idea
router.post("/:ideaId", authMiddleware, voteController.vote);

export default router;
