import { addreview as addreviewService, uPdateReview as uPdateReviewService, deleteReview as deleteReviewService } from "./review.service";
export const addreview = async (req, res) => {
    try {
        const { ideaId, rating, comment } = req.body;
        const userId = req.user.id;
        const result = await addreviewService(ideaId, userId, rating, comment);
        res.json(result);
    }
    catch (error) {
        const message = error.message;
        const status = message === "You have already reviewed this idea" ? 409 : 500;
        res.status(status).json({ message });
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
        const message = error.message;
        let status = 500;
        if (message === "Review not found")
            status = 404;
        if (message === "You can only update your own review")
            status = 403;
        res.status(status).json({ message });
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
        const message = error.message;
        let status = 500;
        if (message === "Review not found")
            status = 404;
        if (message === "You can only delete your own review")
            status = 403;
        res.status(status).json({ message });
    }
};
