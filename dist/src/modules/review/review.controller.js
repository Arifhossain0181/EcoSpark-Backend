import { addreview as addreviewService, uPdateReview as uPdateReviewService, deleteReview as deleteReviewService } from "./review.service";
export const addreview = async (req, res) => {
    try {
        const { ideaId, rating, comment } = req.body;
        const userId = req.user.id;
        const result = await addreviewService(ideaId, userId, rating, comment);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const uPdateReview = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const data = req.body;
        const result = await uPdateReviewService(id, userId, data);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const deleteReview = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const result = await deleteReviewService(id, userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
