import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import {
  insertQuoteRequestSchema,
  loginSchema,
  insertEmailSettingsSchema
} from "@shared/schema";
import { sendQuoteRequestNotification, sendTestEmail } from "./emailService";
import { generateAIImage, analyzeImage } from "./aiImageService";
import { comparePassword, generateToken, hashPassword, verifyToken } from "./authUtils";
import { protect } from "./authMiddleware";
import { toolController } from "./toolController";
import { pdfToolsController, upload } from "./pdfToolsController";
import { cloudConvertController } from "./cloudConvertController";
import { getInstagramImages, proxyInstagramImage } from "./controllers/instagramController";
import { registerAuthRoutes } from "./controllers/auth.controller";
import { registerQuoteRoutes } from "./controllers/quote.controller";
import { registerAiRoutes } from "./controllers/ai.controller";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "fs";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");
  const socketPath = "/api/socket.io";

  const io = new SocketIOServer(httpServer, {
    path: socketPath,
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5000",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication error"));
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") return next(new Error("Admin access required"));
    socket.data.user = decoded;
    next();
  });

  io.on("connection", (socket) => {
    socket.join("admins");
  });

  // Mount extracted controllers
  registerAuthRoutes(app);
  registerQuoteRoutes(app, io);
  registerAiRoutes(app);

  app.get("/api/instagram-images", getInstagramImages);
  app.get("/api/instagram-image-proxy", proxyInstagramImage);

  // --- Email Settings Routes ---
  app.get("/api/email-settings", protect, async (_req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching email settings:", error instanceof Error ? error.message : "Unknown error");
      res.json({});
    }
  });

  app.get("/api/email-logs", protect, async (_req, res) => {
    try {
      const logs = await storage.getEmailLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      res.status(500).json({ error: "Failed to fetch email logs" });
    }
  });

  app.post("/api/email-settings", protect, async (req, res) => {
    try {
      const data = insertEmailSettingsSchema.parse(req.body);
      const settings = await storage.updateEmailSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update email settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid email settings data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  app.post("/api/email-settings/test", protect, async (req, res) => {
    try {
      const { testEmail, settings: tempSettingsRaw } = req.body;
      if (!testEmail) {
        return res.status(400).json({ error: "Test email address is required" });
      }
      const tempSettings = insertEmailSettingsSchema.partial().parse(tempSettingsRaw);
      const result = await sendTestEmail(testEmail, tempSettings);
      if (result.success) {
        res.json({ message: "Test email sent successfully!" });
      } else {
        res.status(500).json({ error: result.error || "Failed to send test email. Check your SMTP configuration." });
      }
    } catch (error: any) {
      console.error("Test email failed:", error?.message || String(error));
      res.status(500).json({ error: error?.message || "Failed to send test email" });
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

  // --- Tool Management Routes ---
  app.get("/api/tools", toolController.getAllTools);
  app.get("/api/tools/:id", toolController.getTool);
  app.get("/api/tools/tool_id/:toolId", toolController.getToolByToolId);
  app.get("/api/tools/slug/:slug", toolController.getToolBySlug);
  app.post("/api/tools", protect, toolController.createTool);
  app.patch("/api/tools/:id", protect, toolController.updateTool);
  app.delete("/api/tools/:id", protect, toolController.deleteTool);

  const toolsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: "Too many conversion requests. Please try again later." }
  });

  // --- PDF Tools Routes ---
  app.post("/api/tools/pdf-to-pptx", toolsLimiter, upload.single("file"), pdfToolsController.convertPdfToPptx);
  app.post("/api/tools/pdf-to-word", toolsLimiter, upload.single("file"), pdfToolsController.convertPdfToWord);
  app.post("/api/tools/word-to-pdf", toolsLimiter, upload.single("file"), pdfToolsController.convertWordToPdf);
  app.post("/api/tools/pptx-to-pdf", toolsLimiter, upload.single("file"), pdfToolsController.convertPptxToPdf);
  app.post("/api/tools/remove-pdf-watermark", toolsLimiter, upload.single("file"), pdfToolsController.removeWatermark);

  // --- CloudConvert Routes ---
  app.post("/api/tools/vsdx-to-jpg", toolsLimiter, upload.single("file"), cloudConvertController.convertVsdxToJpg);
  app.post("/api/tools/jpg-to-vsdx", toolsLimiter, upload.single("file"), cloudConvertController.convertJpgToVsdx);
  app.post("/api/tools/epub-to-pdf", toolsLimiter, upload.single("file"), cloudConvertController.convertEpubToPdf);
  app.post("/api/tools/pdf-to-epub", toolsLimiter, upload.single("file"), cloudConvertController.convertPdfToEpub);
  app.post("/api/tools/mobi-to-pdf", toolsLimiter, upload.single("file"), cloudConvertController.convertMobiToPdf);
  app.post("/api/tools/pdf-to-mobi", toolsLimiter, upload.single("file"), cloudConvertController.convertPdfToMobi);
  app.post("/api/tools/azw3-to-pdf", toolsLimiter, upload.single("file"), cloudConvertController.convertAzw3ToPdf);
  app.post("/api/tools/pdf-to-azw3", toolsLimiter, upload.single("file"), cloudConvertController.convertPdfToAzw3);
  app.post("/api/tools/outlook-to-pdf", toolsLimiter, upload.single("file"), cloudConvertController.convertOutlookToPdf);
  app.post("/api/tools/tiff-to-jpg", toolsLimiter, upload.single("file"), cloudConvertController.convertImage);

  // --- OCR / Image to Text Route ---
  // ⚠️ IMPORTANT: Uses separate memoryStorage uploader — NOT the pdfToolsController's `upload`
  // because pdfToolsController upload may use diskStorage which breaks on serverless/Antigravity
  const ocrUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Please use JPEG, PNG, GIF, or WebP.`));
      }
    }
  });

  app.post("/api/tools/image-to-text", toolsLimiter, ocrUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided. Please upload an image." });
      }

      console.log(`[OCR] Processing: ${req.file.originalname} | ${req.file.mimetype} | ${(req.file.size / 1024).toFixed(1)}KB`);

      // With memoryStorage, buffer is always available directly
      const imageBuffer = req.file.buffer;

      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({ error: "Uploaded file is empty or corrupted." });
      }

      const result = await analyzeImage(imageBuffer, req.file.mimetype);

      console.log(`[OCR] Done: ${result.text.length} chars extracted from ${req.file.originalname}`);

      return res.status(200).json({
        text: result.text,
        charCount: result.text.length
      });

    } catch (error: any) {
      console.error("[OCR] Error:", error.message);

      // Send specific error messages back to client
      const status = error.message?.includes("API key") ? 500
        : error.message?.includes("too large") ? 413
          : error.message?.includes("Rate limit") ? 429
            : 500;

      return res.status(status).json({
        error: error.message || "Failed to extract text from image."
      });
    }
  });

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
  app.get("/api/seo-settings", async (_req, res) => {
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

  // Global Multer error handler
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Maximum size is 10MB for images, 50MB for documents." });
    }
    if (err.message?.includes("Unsupported file type")) {
      return res.status(415).json({ error: err.message });
    }
    next(err);
  });

  return httpServer;
}