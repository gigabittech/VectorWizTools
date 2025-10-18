import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertQuoteRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Quote Request Routes
  app.post("/api/quote-requests", async (req, res) => {
    try {
      const data = insertQuoteRequestSchema.parse(req.body);
      
      // Create quote request
      const quoteRequest = await storage.createQuoteRequest(data);

      // Email notifications - Ready for integration
      // To enable email sending:
      // 1. Set up an email service (SendGrid, Resend, etc.) using the search_integrations tool
      // 2. Configure environment variables for the email service
      // 3. Implement email sending here:
      //    - Send notification to orders@vectorwiz.com with quote details
      //    - Send confirmation email to the submitter (quoteRequest.email)
      // 
      // Example with SendGrid/Resend:
      // await sendEmail({
      //   to: "orders@vectorwiz.com",
      //   from: "orders@vectorwiz.com",
      //   subject: `New Quote Request from ${quoteRequest.firstName} ${quoteRequest.lastName}`,
      //   html: `<p>Project Details: ${quoteRequest.projectDetails}</p>`
      // });
      // await sendEmail({
      //   to: quoteRequest.email,
      //   from: "orders@vectorwiz.com",
      //   subject: "Quote Request Received - VectorWiz",
      //   html: `<p>Thank you for your quote request. We'll get back to you soon!</p>`
      // });

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

  const httpServer = createServer(app);
  return httpServer;
}
