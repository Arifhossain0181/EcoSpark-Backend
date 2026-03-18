import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as reviewController from "./review.controller";
const router = Router();
// Add a review for an idea
router.post("/", authMiddleware, reviewController.addreview);
// Update a review by id
router.patch("/:id", authMiddleware, reviewController.uPdateReview);
// Delete a review by id
router.delete("/:id", authMiddleware, reviewController.deleteReview);
export default router;
