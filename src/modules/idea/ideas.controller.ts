
import { Request, Response } from "express";
import { AuthRequest, IdeaQuery } from "../../tyPes";
import * as ideaService from "./idea.service";

export const getAllIdeas = async (req: Request, res: Response) => {
    try {
        const result = await ideaService.getAllIdeas(req.query as IdeaQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getSearchSuggestions = async (req: Request, res: Response) => {
    try {
        const q = String(req.query.q || "");
        const suggestions = await ideaService.getSearchSuggestions(q, req.user?.id);
        res.json({ suggestions });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getPersonalRecommendations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const recommendations = await ideaService.getPersonalRecommendations(userId);
        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getTrendingRecommendations = async (_req: Request, res: Response) => {
    try {
        const recommendations = await ideaService.getTrendingRecommendations();
        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const trackIdeaInteraction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const ideaId = String(req.params.id || "");
        if (!ideaId) {
            return res.status(400).json({ error: "Idea id is required" });
        }
        const type = typeof req.body?.type === "string" ? req.body.type.trim() : "";
        if (!type) {
            return res.status(400).json({ error: "Interaction type is required" });
        }

        await ideaService.trackIdeaInteraction(ideaId, userId, type);
        return res.json({ message: "Interaction tracked" });
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};

export const getRecommendationClickAnalytics = async (req: Request, res: Response) => {
    try {
        const daysValue = Number(req.query.days);
        const days = Number.isFinite(daysValue) && daysValue > 0 ? Math.min(daysValue, 30) : 7;
        const analytics = await ideaService.getRecommendationClickAnalytics(days);
        return res.json(analytics);
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
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
        const err = error as Error & { statusCode?: number };
        res.status(err.statusCode ?? 500).json({ error: err.message });
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
        const err = error as Error & { statusCode?: number };
        res.status(err.statusCode ?? 500).json({
            error:
                err.message || "An error occurred while updating the idea",
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
        const err = error as Error & { statusCode?: number };
        res.status(err.statusCode ?? 500).json({
            error: err.message || "An error occurred while deleting the idea",
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


