
import { Request, Response } from "express";
import { AuthRequest, IdeaQuery } from "../../tyPes";
import * as ideaService from "./idea.service";
import { error } from "console";

export const getAllIdeas = async (req: Request, res: Response) => {
    try {
        const result = await ideaService.getAllIdeas(req.query as IdeaQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getIdeaById = async (req: Request, res: Response) => {
    try{
        const id  = req.params.id;
        const idea = await ideaService.getIdeaById(id as string);
        if(!idea){
            return res.status(404).json({ error: "Idea not found" });
        }
        res.json(idea);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });

    }
   }

export const createIdea = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const userId = req.user!.id as string;
        const idea = await ideaService.createIdea(data, userId);
        res.status(201).json(idea);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
export const submitIdea = async (req: AuthRequest, res: Response ,): Promise<void> => {
    try{
        const id = req.params.id;
        const userId = req.user!.id as string;
        await ideaService.submitIdea(id as string, userId);
        res.json({ message: "Idea submitted successfully" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });

    }
}

export const uPdateIdea = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id;
        const data = req.body;
        const userId = req.user!.id as string;
        const idea = await ideaService.uPdateIdea(id as string, data, userId);
        res.json(idea);
    } catch (error) {
        res.status(500).json({
            message:
                error instanceof Error
                    ? error.message
                    : "An error occurred while updating the idea",
        });
    }
};
export const deleteIdea = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
        const userId = req.user!.id as string;
        const role = req.user!.role as string;
        await ideaService.deleteIdea(id as string, userId, role);
        res.json({ message: "Idea deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : "An error occurred while deleting the idea",
        });
    }

}
export const getMyIdeas = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id as string;
        const ideas = await ideaService.getmyIdeas(userId);
        res.json(ideas);
    } catch (error) {        res.status(500).json({ error: (error as Error).message });
    }
}


