import type { Express } from "express";
import { storage } from "../storage";
import { generateAIImage } from "../aiImageService";
import { protect } from "../authMiddleware";
import rateLimit from "express-rate-limit";

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10,
  message: { message: "Too many AI image generations, please try again later." }
});

export function registerAiRoutes(app: Express) {
  app.post("/api/tools/ai-image-generator", aiLimiter, async (req, res) => {
    try {
      const { prompt, model, size, quality, style, n } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
        return res.status(400).json({
          error: "Prompt is required and must be at least 10 characters long"
        });
      }

      if (!model || !["dall-e-3", "dall-e-2", "stable-diffusion", "gemini", "free-model"].includes(model)) {
        return res.status(400).json({
          error: "Invalid model. Must be one of: dall-e-3, dall-e-2, stable-diffusion, gemini, free-model"
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
            model === "stable-diffusion" || model === "free-model" ? "stability-ai" :
              model === "gemini" ? "google" : "replicate";

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

      const imageResponse = await fetch(imageUrl, {
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

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

  app.get("/api/ai-generations", protect, async (_req, res) => {
    try {
      const generations = await storage.getAllAIImageGenerations();
      res.json(generations);
    } catch (error) {
      console.error("Failed to fetch AI image generations:", error);
      res.status(500).json({ error: "Failed to fetch AI image generations" });
    }
  });
}
