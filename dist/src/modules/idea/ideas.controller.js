import * as ideaService from "./idea.service";
export const getAllIdeas = async (req, res) => {
    try {
        const result = await ideaService.getAllIdeas(req.query);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getIdeaById = async (req, res) => {
    try {
        const id = req.params.id;
        const idea = await ideaService.getIdeaById(id);
        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }
        res.json(idea);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const createIdea = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user.id;
        const idea = await ideaService.createIdea(data, userId);
        res.status(201).json(idea);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const submitIdea = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        await ideaService.submitIdea(id, userId);
        res.json({ message: "Idea submitted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const uPdateIdea = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const userId = req.user.id;
        const idea = await ideaService.uPdateIdea(id, data, userId);
        res.json(idea);
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "An error occurred while updating the idea",
        });
    }
};
export const deleteIdea = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const role = req.user.role;
        await ideaService.deleteIdea(id, userId, role);
        res.json({ message: "Idea deleted successfully" });
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : "An error occurred while deleting the idea",
        });
    }
};
export const getMyIdeas = async (req, res) => {
    try {
        const userId = req.user.id;
        const ideas = await ideaService.getmyIdeas(userId);
        res.json(ideas);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
