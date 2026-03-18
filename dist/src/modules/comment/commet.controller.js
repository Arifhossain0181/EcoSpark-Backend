import { getcomments, addComment as addCommentService, deleteComment as deleteCommentService, } from "./comment.service";
export const getComments = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const comments = await getcomments(ideaId);
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const addComment = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const text = req.body.text;
        const parentId = req.body.parentId || undefined;
        const userId = req.user.id;
        await addCommentService(ideaId, userId, text, parentId);
        res.json({ message: "Comment added successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
};
