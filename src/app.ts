import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { AuthRequest } from "./tyPes";
import authRoutes from "./middleware/auth/auth.route";
import commentRoutes from "./modules/comment/comment.routes";
import ideaRoutes from "./modules/idea/idea.route";
import voteRoutes from "./modules/vote/vote.routes";
import reviewRoutes from "./modules/review/review.route";
import categoryRoutes from "./modules/category/category.route";
import adminRoutes from "./modules/admin/admin.route";
import watchlistRoutes from "./modules/watchlist/watchlist.route";
import paymentRoutes from "./modules/Payment/Payment.route";
import statsRoutes from "./modules/stats/stats.route";
import chatRoutes from "./modules/CHTBOT/chat.router";
import newsletterRoutes from "./modules/newsletter/newsletter.route";
import { chatHandler } from "./modules/CHTBOT/chat.controller";
import * as paymentController from "./modules/Payment/Payment.controller";

dotenv.config();
const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Stripe webhook needs the raw body for signature verification
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentController.handleWebhook
);

// Standard parsers for the rest of the routes
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Root route
app.get("/", (req, res) => {
    res.json({message: "Welcome to EcoSpark API"});
})

// Public route
app.get("/api/hello" , (req, res)=>{
    res.json({message:"Hello World"});
})
app.use("/api/comments", commentRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/chatbot", chatRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.post("/api/chat", chatHandler);

// Protected route (requires auth)
app.get("/api/protected", authMiddleware, (req: AuthRequest, res)=>{
    res.json({message:"This is protected", user: req.user});
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(errorMiddleware);

export default app;