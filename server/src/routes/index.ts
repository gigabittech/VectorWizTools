import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "../data/storage";
import { insertQuoteRequestSchema, loginSchema } from "@shared/schema";
import { sendQuoteRequestNotification } from "../services/emailService";
import { generateAIImage } from "../services/aiImageService";
import { comparePassword, generateToken } from "../utils/auth";
import { protect } from "../middlewares/auth";
import { toolController } from "../controllers/toolController";
import { pdfToolsController, upload } from "../controllers/pdfToolsController";

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

  // --- Tool Management Routes ---
  app.get("/api/tools", toolController.getAllTools);
  app.get("/api/tools/:id", toolController.getTool);
  app.get("/api/tools/tool_id/:toolId", toolController.getToolByToolId);
  app.get("/api/tools/slug/:slug", toolController.getToolBySlug);
  app.post("/api/tools", protect, toolController.createTool);
  app.patch("/api/tools/:id", protect, toolController.updateTool);
  app.delete("/api/tools/:id", protect, toolController.deleteTool);

  // --- pdf tools route ---
  app.post("/api/tools/pdf-to-pptx", upload.single("file"), pdfToolsController.convertPdfToPptx);
  app.post("/api/tools/pdf-to-word", upload.single("file"), pdfToolsController.convertPdfToWord);
  app.post("/api/tools/word-to-pdf", upload.single("file"), pdfToolsController.convertWordToPdf);
  app.post("/api/tools/pptx-to-pdf", upload.single("file"), pdfToolsController.convertPptxToPdf);
  app.post("/api/tools/remove-pdf-watermark", upload.single("file"), pdfToolsController.removeWatermark);
  app.post("/api/tools/mobi-to-pdf", upload.single("file"), pdfToolsController.convertMobiToPdf);
  app.post("/api/tools/pdf-to-mobi", upload.single("file"), pdfToolsController.convertPdfToMobi);

  // --- CMS Management Routes ---
  app.patch("/api/tools/:id/seo", protect, async (req, res) => {
    try {
      const toolId = req.params.id;
      const data = req.body;
      const result = await storage.updateToolSeo(toolId, data);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update SEO" });
    }
  });

  app.patch("/api/tools/:id/contents", protect, async (req, res) => {
    try {
      const toolId = req.params.id;
      const data = req.body;
      const result = await storage.updateToolContents(toolId, data);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  app.get("/api/tools/:id/faqs", async (req, res) => {
    try {
      const result = await storage.getToolFaqs(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/tools/:id/faqs", protect, async (req, res) => {
    try {
      const data = { ...req.body, toolId: req.params.id };
      const result = await storage.createToolFaq(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.patch("/api/faqs/:id", protect, async (req, res) => {
    try {
      const result = await storage.updateToolFaq(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/faqs/:id", protect, async (req, res) => {
    try {
      await storage.deleteToolFaq(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // --- Internal Links Routes ---
  app.get("/api/tools/:id/internal-links", async (req, res) => {
    try {
      const result = await storage.getToolInternalLinks(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch internal links" });
    }
  });

  app.post("/api/tools/:id/internal-links", protect, async (req, res) => {
    try {
      const data = { ...req.body, toolId: req.params.id };
      const result = await storage.createToolInternalLink(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create internal link" });
    }
  });

  app.delete("/api/internal-links/:id", protect, async (req, res) => {
    try {
      await storage.deleteToolInternalLink(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete internal link" });
    }
  });

  // --- Redirects Routes ---
  app.get("/api/redirects", protect, async (_req, res) => {
    try {
      const result = await storage.getAllRedirects();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch redirects" });
    }
  });

  app.post("/api/redirects", protect, async (req, res) => {
    try {
      const result = await storage.createRedirect(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create redirect" });
    }
  });

  app.patch("/api/redirects/:id", protect, async (req, res) => {
    try {
      const result = await storage.updateRedirect(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update redirect" });
    }
  });

  app.delete("/api/redirects/:id", protect, async (req, res) => {
    try {
      await storage.deleteRedirect(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete redirect" });
    }
  });

  // --- SEO Settings Routes ---
  app.get("/api/seo-settings", protect, async (_req, res) => {
    try {
      const result = await storage.getSeoSettings();
      res.json(result || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SEO settings" });
    }
  });

  app.patch("/api/seo-settings", protect, async (req, res) => {
    try {
      const result = await storage.updateSeoSettings(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update SEO settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
