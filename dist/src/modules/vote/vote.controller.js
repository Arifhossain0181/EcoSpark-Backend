import { castVote } from "./vote.service";
import { VoteType } from "../../generated/prisma/enums";
export const vote = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const userId = req.user.id;
        const { type } = req.body;
        if (!Object.values(VoteType).includes(type)) {
            return res.status(400).json({ error: "Invalid vote type" });
        }
        const result = await castVote(ideaId, userId, type);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
