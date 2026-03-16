import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./authUtils";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
    };
}

export function protect(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }

    req.user = decoded;
    next();
}

export function restrictTo(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Access is denied" });
        }
        next();
    };
}
