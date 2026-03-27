import * as paymentService from "./Payment.service";
export const initPayment = async (req, res) => {
    try {
        const { ideaId } = req.body;
        const result = await paymentService.initPayment(req.user.id, ideaId);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const handleWebhook = async (req, res) => {
    try {
        const sig = req.headers["stripe-signature"];
        const payload = req.body;
        const result = await paymentService.handleWebhook(payload, sig);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const verifySession = async (req, res) => {
    try {
        const sessionId = req.query.sessionId || "";
        const result = await paymentService.verifySession(sessionId, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const checkAccess = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const result = await paymentService.checkAccess(ideaId, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const getAllPaymentsForAdmin = async (req, res) => {
    try {
        const result = await paymentService.getAllPaymentsForAdmin();
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch payments";
        res.status(500).json({
            success: false,
            message,
        });
    }
};
export const getMyPurchasedIdeas = async (req, res) => {
    try {
        const result = await paymentService.getMyPurchasedIdeas(req.user.id);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch purchased ideas";
        res.status(500).json({
            success: false,
            message,
        });
    }
};
