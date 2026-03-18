import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import authRoutes from "./middleware/auth/auth.route";
import commentRoutes from "./modules/comment/comment.routes";
import ideaRoutes from "./modules/idea/idea.route";
import voteRoutes from "./modules/vote/vote.routes";
import reviewRoutes from "./modules/review/review.route";
import categoryRoutes from "./modules/category/category.route";
import adminRoutes from "./modules/admin/admin.route";
import watchlistRoutes from "./modules/watchlist/watchlist.route";
import paymentRoutes from "./modules/Payment/Payment.route";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;
// Root route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to EcoSpark API" });
});
// Public route
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello World" });
});
app.use("/api/comments", commentRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/payments", paymentRoutes);
// Protected route (requires auth)
app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({ message: "This is protected", user: req.user });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Global error handler
app.use(errorMiddleware);
export default app;
