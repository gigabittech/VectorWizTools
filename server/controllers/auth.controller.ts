import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { loginSchema } from "@shared/schema";
import { comparePassword, generateToken, hashPassword } from "../authUtils";
import { protect } from "../authMiddleware";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 15,
  message: { message: "Too many login attempts, please try again later." }
});

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction, 
        sameSite: isProduction ? "none" : "lax", 
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000, 
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", protect, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/auth/me", protect, async (req: any, res) => {
    try {
      const { username, name, email, password, oldPassword } = req.body;
      const updateData: any = {};

      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (username) updateData.username = username;
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      if (password) {
        if (!oldPassword) {
          return res.status(400).json({ message: "Current password is required to change your password." });
        }
        const isMatch = await comparePassword(oldPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Incorrect current password." });
        }
        if (password.length < 10 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          return res.status(400).json({ message: "Password must be at least 10 characters long and contain at least 1 number and 1 special character." });
        }
        updateData.password = await hashPassword(password);
      }

      const updatedUser = await storage.updateUser(req.user.userId, updateData);

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email
      });
    } catch (error: any) {
      console.error("User update error:", error);
      res.status(500).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // --- Admin User Management Routes ---
  app.get("/api/users", protect, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ id: u.id, username: u.username, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", protect, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { username, password, email, name, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email: email || undefined,
        name: name || undefined,
        role: role || "admin"
      });

      res.status(201).json({ id: newUser.id, username: newUser.username, name: newUser.name, email: newUser.email, role: newUser.role });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", protect, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { username, email, name, password, role } = req.body;
      const updateData: any = {};

      if (username) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (role) updateData.role = role;

      if (password) {
        updateData.password = await hashPassword(password);
      }

      const updatedUser = await storage.updateUser(req.params.id, updateData);
      res.json({ id: updatedUser.id, username: updatedUser.username, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", protect, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      if (req.params.id === req.user.userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete user" });
    }
  });
}
