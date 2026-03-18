import { Request, Response } from "express";
import { AuthRequest } from "../../tyPes";
import { prisma } from "../../config/Prisma";

export const toggleWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const ideaId = req.params.ideaId as string;
    const userId = req.user!.id as string;

    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required",
      });
    }

    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId,
        },
      },
    });

    if (existing) {
      await prisma.watchlist.delete({
        where: { id: existing.id },
      });
      return res.status(200).json({
        success: true,
        message: "Removed from watchlist",
      });
    }

    await prisma.watchlist.create({
      data: {
        userId,
        ideaId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Added to watchlist",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message || "Something went wrong",
    });
  }
};

export const getwatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id as string;

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        idea: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: watchlist,
      message: "Watchlist retrieved successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message || "Something went wrong",
    });
  }
};
