import { Response } from "express";
import { AuthRequest } from "../../tyPes";
import {
    getcomments,
    addComment as addCommentService,
    deleteComment as deleteCommentService,
} from "./comment.service";

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const ideaId = req.params.ideaId as string;
        const comments = await getcomments(ideaId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const ideaId = req.params.ideaId as string;
        const text = req.body.text as string;
        const parentId = (req.body.parentId as string | undefined) || undefined;
        const userId = req.user!.id as string;
        await addCommentService(ideaId, userId, text, parentId);
        res.json({ message: "Comment added successfully" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
export const deleteComment = async (req: AuthRequest, res: Response) => {
    try{
        const commentId = req.params.id as string;
        const userId = req.user!.id as string;
        const role = req.user!.role as string;
        await deleteCommentService(commentId, userId, role);
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}