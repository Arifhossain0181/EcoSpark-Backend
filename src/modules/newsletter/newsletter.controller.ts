import { Request, Response } from "express";
import {
  buildNewsletterBundleForUser,
  sendNewsletterToAllUsers,
  sendNewsletterToUser,
} from "./newsletter.service";
import { runNewsletterDispatchNow } from "./newsletter.scheduler";

export const getMyRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bundle = await buildNewsletterBundleForUser(userId);
    return res.json({
      subject: bundle.subject,
      previewText: bundle.previewText,
      recommendations: bundle.recommendations,
      updates: bundle.updates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build recommendations";
    return res.status(500).json({ message });
  }
};

export const sendMeNewsletter = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await sendNewsletterToUser(userId);
    return res.json({ message: "Newsletter sent", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send newsletter";
    return res.status(500).json({ message });
  }
};

export const sendAllNewsletters = async (req: Request, res: Response) => {
  try {
    const requested = Number(req.body?.limit);
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 1000) : 200;

    const result = await sendNewsletterToAllUsers(limit);
    return res.json({ message: "Bulk newsletter processing completed", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send newsletters";
    return res.status(500).json({ message });
  }
};

export const runNewsletterNow = async (req: Request, res: Response) => {
  try {
    const requested = Number(req.body?.limit);
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 1000) : undefined;

    const result = await runNewsletterDispatchNow(limit);
    return res.json({ message: "Newsletter cron simulation executed", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute newsletter cron simulation";
    return res.status(500).json({ message });
  }
};
