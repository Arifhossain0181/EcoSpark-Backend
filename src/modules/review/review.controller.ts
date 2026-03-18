
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
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
    }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.id as string;
        const result = await deleteReviewService(id, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};