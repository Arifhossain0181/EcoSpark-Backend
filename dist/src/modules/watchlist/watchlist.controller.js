import { toggleWatchlist as toggleWatchlistService, getwatchlist as getwatchlistService } from "./watchlist.service";
export const toggleWatchlist = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const userId = req.user.id;
        if (!ideaId) {
            return res.status(400).json({
                success: false,
                message: "Idea ID is required",
            });
        }
        const result = await toggleWatchlistService(ideaId, userId);
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};
export const getwatchlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const watchlist = await getwatchlistService(userId);
        return res.status(200).json({
            success: true,
            data: watchlist,
            message: "Watchlist retrieved successfully",
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};
