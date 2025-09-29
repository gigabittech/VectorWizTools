import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
const JWT_ISSUER = process.env.JWT_ISSUER || "vectorwiz-portal";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "localhost";

export interface AuthRequest extends Request {
  user?: User;
}

export const signAccess = (sub: string, role: string) =>
  jwt.sign({ sub, role }, JWT_ACCESS_SECRET, { 
    expiresIn: '15m', 
    issuer: JWT_ISSUER 
  });

export const signRefresh = (sub: string, jti: string) =>
  jwt.sign({ sub, jti }, JWT_REFRESH_SECRET, { 
    expiresIn: '30d', 
    issuer: JWT_ISSUER 
  });

export const verifyAccess = (token: string) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
};

export const verifyRefresh = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    const payload = verifyAccess(accessToken);
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: "Invalid access token" });
    }

    const user = await storage.getUser(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const designerMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "DESIGNER")) {
    return res.status(403).json({ error: "Designer access required" });
  }
  next();
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    domain: COOKIE_DOMAIN === "localhost" ? undefined : COOKIE_DOMAIN,
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const clearAuthCookies = (res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    domain: COOKIE_DOMAIN === "localhost" ? undefined : COOKIE_DOMAIN,
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};
