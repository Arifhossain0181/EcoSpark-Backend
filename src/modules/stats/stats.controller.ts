import { Request, Response } from "express";
import { prisma } from "../../config/Prisma";

export const getStats = async (req: Request, res: Response) => {
  try {
    const [ideasShared, members, approved] = await Promise.all([
      prisma.idea.count(),
      prisma.user.count(),
      prisma.idea.count({ where: { status: "APPROVED" } }),
    ]);

    res.json({
      ideasShared,
      members,
      approved,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
