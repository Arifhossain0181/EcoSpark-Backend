import { AuthRequest } from "../../tyPes";
import { Request, Response } from "express";
import * as paymentService from "./Payment.service";

export const initPayment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { ideaId } = req.body;
        const result = await paymentService.initPayment(req.user!.id, ideaId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const handleWebhook = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const sig = req.headers["stripe-signature"] as string;
        const payload = req.body as Buffer;
        const result = await paymentService.handleWebhook(payload, sig);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const verifySession = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const sessionId = (req.query.sessionId as string) || "";
        const result = await paymentService.verifySession(sessionId, req.user!.id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const checkAccess = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { ideaId } = req.params as { ideaId: string };
        const result = await paymentService.checkAccess(ideaId, req.user!.id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllPaymentsForAdmin = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const result = await paymentService.getAllPaymentsForAdmin();
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch payments";
        res.status(500).json({
            success: false,
            message,
        });
    }
};