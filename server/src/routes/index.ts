import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "../data/storage";
import { insertQuoteRequestSchema, loginSchema } from "@shared/schema";
import { sendQuoteRequestNotification } from "../services/emailService";
import { generateAIImage } from "../services/aiImageService";
import { comparePassword, generateToken } from "../utils/auth";
import { protect } from "../middlewares/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // --- Auth Routes ---
  app.post("/api/auth/login", async (req, res) => {
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

      // Set cookie for browser-based auth
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // --- Quote Request Routes ---
  app.post("/api/quote-requests", async (req, res) => {
    try {
      const data = insertQuoteRequestSchema.parse(req.body);

      // Create quote request
      const quoteRequest = await storage.createQuoteRequest(data);

      // Send email notifications via Brevo
      await sendQuoteRequestNotification({
        firstName: quoteRequest.firstName || '',
        lastName: quoteRequest.lastName || '',
        email: quoteRequest.email,
        projectDetails: quoteRequest.projectDetails,
        numberOfFiles: quoteRequest.numberOfFiles || '',
        turnaroundTime: quoteRequest.turnaroundTime || '',
      });

      res.json(quoteRequest);
    } catch (error) {
      console.error("Quote request error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit quote request" });
    }
  });

  // PROTECTED: Get all quote requests
  app.get("/api/quote-requests", protect, async (_req, res) => {
    try {
      const quoteRequests = await storage.getAllQuoteRequests();
      res.json(quoteRequests);
    } catch (error) {
      console.error("Failed to fetch quote requests:", error);
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });

  // PROTECTED: Get all AI image generations
  app.get("/api/ai-generations", protect, async (_req, res) => {
    try {
      const generations = await storage.getAllAIImageGenerations();
      res.json(generations);
    } catch (error) {
      console.error("Failed to fetch AI image generations:", error);
      res.status(500).json({ error: "Failed to fetch AI image generations" });
    }
  });

  // --- Tool Routes ---
  app.post("/api/tools/turnaround", async (req, res) => {
    try {
      const { service, complexity, fileCount } = req.body;

      const baseDays: Record<string, number> = {
        IMAGE_TO_VECTOR: 3,
        LOGO_VECTORIZATION: 3,
        PDF_TO_VECTOR: 2,
        DXF_CUTTER_READY: 4,
        RASTER_TO_VECTOR: 3,
      };

      const complexityMultiplier: Record<string, number> = {
        simple: 0.8,
        medium: 1.0,
        complex: 1.5,
      };

      const days = Math.ceil(
        (baseDays[service] || 3) *
        (complexityMultiplier[complexity] || 1.0) *
        (fileCount > 10 ? 1.3 : 1.0)
      );

      res.json({
        estimatedDays: days,
        description: `${days}-${days + 2} business days`,
        rushAvailable: days > 2,
      });
    } catch (error) {
      console.error("Turnaround estimation error:", error);
      res.status(500).json({ error: "Failed to estimate turnaround time" });
    }
  });

  app.post("/api/tools/ai-image-generator", async (req, res) => {
    try {
      const { prompt, model, size, quality, style, n } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
        return res.status(400).json({
          error: "Prompt is required and must be at least 10 characters long"
        });
      }

      if (!model || !["dall-e-3", "dall-e-2", "stable-diffusion"].includes(model)) {
        return res.status(400).json({
          error: "Invalid model. Must be one of: dall-e-3, dall-e-2, stable-diffusion"
        });
      }

      const result = await generateAIImage({
        prompt: prompt.trim(),
        model,
        size: size || "1024x1024",
        quality,
        style,
        n: n || 1,
      });

      if (result.imageUrl) {
        try {
          const provider = model.startsWith("dall-e") ? "openai" :
            model === "stable-diffusion" ? "stability-ai" : "replicate";

          let costCents: number | undefined;
          if (model === "dall-e-3") {
            costCents = quality === "hd" ? 8 : 4;
          } else if (model === "dall-e-2") {
            costCents = 2;
          }

          await storage.createAIImageGeneration({
            prompt: prompt.trim(),
            model,
            size: size || "1024x1024",
            quality: quality || undefined,
            style: style || undefined,
            imageUrl: result.imageUrl,
            provider,
            costCents,
          });
        } catch (dbError) {
          console.error("Failed to store AI image generation in database:", dbError);
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("AI image generation error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate image. Please check your API keys and try again."
      });
    }
  });

  app.get("/api/tools/ai-image-proxy", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;

      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      try {
        new URL(imageUrl);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      const imageResponse = await fetch(imageUrl);

      if (!imageResponse.ok) {
        return res.status(imageResponse.status).json({
          error: `Failed to fetch image: ${imageResponse.statusText}`
        });
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get("content-type") || "image/png";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", imageBuffer.byteLength);
      res.setHeader("Cache-Control", "public, max-age=31536000");

      res.send(Buffer.from(imageBuffer));
    } catch (error: any) {
      console.error("Image proxy error:", error);
      res.status(500).json({
        error: error.message || "Failed to proxy image"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
