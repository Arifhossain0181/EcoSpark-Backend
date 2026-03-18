import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { toggleWatchlist, getwatchlist } from "./watchlist.controller";

const router = Router();

// Get all watchlist items for the logged-in user
router.get("/", authMiddleware, getwatchlist);

// Toggle watchlist (add/remove an idea)
router.post("/:ideaId", authMiddleware, toggleWatchlist);

export default router;