import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertQuoteRequestSchema, insertAIImageGenerationSchema } from "@shared/schema";
import { sendQuoteRequestNotification } from "./emailService";
import { generateAIImage } from "./aiImageService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Quote Request Routes
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

  // Get all quote requests (could be used for admin panel in future)
  app.get("/api/quote-requests", async (req, res) => {
    try {
      const quoteRequests = await storage.getAllQuoteRequests();
      res.json(quoteRequests);
    } catch (error) {
      console.error("Failed to fetch quote requests:", error);
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });

  // Tool Routes - Turnaround Estimator
  app.post("/api/tools/turnaround", async (req, res) => {
    try {
      const { service, complexity, fileCount } = req.body;
      
      // Simple turnaround estimation logic
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

  // Tool Routes - AI Image Generator
  app.post("/api/tools/ai-image-generator", async (req, res) => {
    try {
      const { prompt, model, size, quality, style, n } = req.body;

      // Validate input
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

      // Generate image
      const result = await generateAIImage({
        prompt: prompt.trim(),
        model,
        size: size || "1024x1024",
        quality,
        style,
        n: n || 1,
      });

      // Store in database if generation was successful
      if (result.imageUrl) {
        try {
          // Determine provider based on model
          const provider = model.startsWith("dall-e") ? "openai" : 
                          model === "stable-diffusion" ? "stability-ai" : "replicate";
          
          // Calculate estimated cost (in cents)
          // DALL-E 3: $0.040 (standard) or $0.080 (hd) per image
          // DALL-E 2: $0.020 per image (1024x1024)
          let costCents: number | undefined;
          if (model === "dall-e-3") {
            costCents = quality === "hd" ? 8 : 4; // $0.08 or $0.04
          } else if (model === "dall-e-2") {
            costCents = 2; // $0.02
          }
          // Stability AI pricing varies, leave undefined for now

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
          // Log but don't fail the request if DB storage fails
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

  // Proxy endpoint to fetch images (bypasses CORS)
  app.get("/api/tools/ai-image-proxy", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;

      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      // Validate URL
      try {
        new URL(imageUrl);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Fetch the image
      const imageResponse = await fetch(imageUrl);

      if (!imageResponse.ok) {
        return res.status(imageResponse.status).json({ 
          error: `Failed to fetch image: ${imageResponse.statusText}` 
        });
      }

      // Get the image as buffer
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get("content-type") || "image/png";

      // Set appropriate headers
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", imageBuffer.byteLength);
      res.setHeader("Cache-Control", "public, max-age=31536000");

      // Send the image
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
