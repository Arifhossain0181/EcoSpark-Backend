import { approveIdea, deleteUser, getAllIdeas, getAllUsers, rejectIdea, getDashboardStats, updateUser } from "./admin.service";
export const getAllIdeasController = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const result = await getAllIdeas(page, limit);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch ideas",
        });
    }
};
export const approveIdeaController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await approveIdea(id);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Idea approved successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to approve idea",
        });
    }
};
export const rejectIdeaController = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        if (!feedback) {
            return res.status(400).json({
                success: false,
                message: "Feedback is required to reject an idea",
            });
        }
        const result = await rejectIdea(id, feedback);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Idea rejected successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to reject idea",
        });
    }
};
export const getAllUsersController = async (req, res) => {
    try {
        const result = await getAllUsers();
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};
export const updateUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const result = await updateUser(id, data);
        res.status(200).json({
            success: true,
            data: result,
            message: "User updated successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
};
export const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteUser(id);
        res.status(200).json({
            success: true,
            data: result,
            message: "User deleted successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};
export const dashboardStatsController = async (req, res) => {
    try {
        const result = await getDashboardStats();
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats",
        });
    }
};
