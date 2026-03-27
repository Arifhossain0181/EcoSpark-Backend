import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (err: Error, req: Request, res: Response , next: NextFunction) => {
    if (res.headersSent) {
        next(err);
        return;
    }

    const errorWithStatus = err as Error & { statusCode?: number; code?: string; name?: string };

    let statusCode = errorWithStatus.statusCode ?? 500;
    let message = errorWithStatus.message || "Internal Server Error";

    if (errorWithStatus.name === "JsonWebTokenError" || errorWithStatus.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Invalid or expired token";
    }

    if (errorWithStatus.code === "P2002") {
        statusCode = 409;
        message = "Duplicate value violates a unique constraint";
    }

    if (errorWithStatus.code === "P2025") {
        statusCode = 404;
        message = "Requested resource was not found";
    }

    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({ message });
}