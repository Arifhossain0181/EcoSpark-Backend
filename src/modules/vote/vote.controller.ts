import { Request, Response } from "express";
import { AuthRequest } from "../../tyPes";
import { castVote } from "./vote.service";
import { VoteType } from "../../generated/prisma/enums";

export const vote = async (req: AuthRequest, res: Response) => {
	try {
		const ideaId = req.params.ideaId as string;
		const userId = req.user!.id as string;
		const { type } = req.body as { type: VoteType };

		if (!Object.values(VoteType).includes(type)) {
			return res.status(400).json({ error: "Invalid vote type" });
		}

		const result = await castVote(ideaId, userId, type);
		res.json(result);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
};
