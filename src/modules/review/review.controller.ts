
import { Response } from "express";
import { AuthRequest } from "../../tyPes";
import { addreview as addreviewService, uPdateReview as uPdateReviewService, deleteReview as deleteReviewService } from "./review.service";

export const addreview = async (req: AuthRequest, res: Response) => {
    try {
        const { ideaId, rating, comment } = req.body as {
            ideaId: string;
            rating: number;
            comment: string;
        };
        const userId = req.user!.id as string;
        const result = await addreviewService(ideaId, userId, rating, comment);
        res.json(result);
    } catch (error) {
        const message = (error as Error).message;
        const status = message === "You have already reviewed this idea" ? 409 : 500;
        res.status(status).json({ message });
    }
};

export const uPdateReview = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.id as string;
        const data = req.body;
        const result = await uPdateReviewService(id, userId, data);
        res.json(result);
    } catch (error) {
        const message = (error as Error).message;
        let status = 500;
        if (message === "Review not found") status = 404;
        if (message === "You can only update your own review") status = 403;
        res.status(status).json({ message });
    }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.id as string;
        const result = await deleteReviewService(id, userId);
        res.json(result);
    } catch (error) {
        const message = (error as Error).message;
        let status = 500;
        if (message === "Review not found") status = 404;
        if (message === "You can only delete your own review") status = 403;
        res.status(status).json({ message });
    }
};