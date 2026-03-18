import { AuthRequest } from "../tyPes";
import { NextFunction, Response } from "express";
import jwt from  "jsonwebtoken";


export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: 'MEMBER' | 'ADMIN' };
        req.user = { id: decoded.userId, role: decoded.role };
        next();
        return;
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
        return;
    }
}
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ message: "Forbidden: Admins only" });
        return;
    }
    next();

}