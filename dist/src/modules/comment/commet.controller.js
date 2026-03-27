import { getcomments, addComment as addCommentService, deleteComment as deleteCommentService, getAllCommentsForAdmin, } from "./comment.service";
export const getComments = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const comments = await getcomments(ideaId);
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const addComment = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const text = (req.body.text ?? req.body.content);
        const parentId = req.body.parentId || undefined;
        const userId = req.user.id;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "Comment text is required" });
        }
        await addCommentService(ideaId, userId, text, parentId);
        res.json({ message: "Comment added successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;
        const role = req.user.role;
        await deleteCommentService(commentId, userId, role);
        res.json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllCommentsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const comments = await getAllCommentsForAdmin(page, limit);
        res.json({
            success: true,
            data: comments,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch comments",
        });
    }
};
