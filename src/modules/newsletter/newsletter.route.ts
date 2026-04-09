import express from "express";
import { adminOnly, authMiddleware, adminOrManager } from "../../middleware/auth.middleware";
import {
  getMyRecommendations,
  runNewsletterNow,
  sendAllNewsletters,
  sendMeNewsletter,
} from "./newsletter.controller";

const router = express.Router();

router.get("/recommendations", authMiddleware, getMyRecommendations);
router.post("/send-me", authMiddleware, sendMeNewsletter);
router.post("/send-all", authMiddleware, adminOrManager, sendAllNewsletters);
router.post("/run-now", authMiddleware, adminOnly, runNewsletterNow);

export default router;
