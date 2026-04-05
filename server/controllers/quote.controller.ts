import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertQuoteRequestSchema } from "@shared/schema";
import { protect } from "../authMiddleware";
import { upload_quote } from "./upload.controller";
import { sendQuoteRequestNotification } from "../emailService";
import { Server as SocketIOServer } from "socket.io";

export function registerQuoteRoutes(app: Express, io: SocketIOServer) {
  app.post("/api/quote-requests", upload_quote.array("files"), async (req, res) => {
    try {
      const body = req.body;
      const data = insertQuoteRequestSchema.parse({ ...body });

      const fileUrls = (req.files as Express.Multer.File[])?.map(file => {
        return `/uploads/quote-requests/${file.filename}`;
      }) || [];

      const quoteRequest = await storage.createQuoteRequest({
        ...data,
        fileUrls
      });

      await sendQuoteRequestNotification({
        firstName: quoteRequest.firstName || '',
        lastName: quoteRequest.lastName || '',
        email: quoteRequest.email,
        projectDetails: quoteRequest.projectDetails,
        numberOfFiles: quoteRequest.numberOfFiles || '',
        turnaroundTime: quoteRequest.turnaroundTime || '',
        status: quoteRequest.status,
        fileUrls: quoteRequest.fileUrls || []
      });

      io.to("admins").emit("new_quote_request", quoteRequest);

      res.json(quoteRequest);
    } catch (error) {
      console.error("Quote request error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit quote request" });
    }
  });

  app.get("/api/quote-requests", protect, async (_req, res) => {
    try {
      const quoteRequests = await storage.getAllQuoteRequests();
      res.json(quoteRequests);
    } catch (error) {
      console.error("Failed to fetch quote requests:", error);
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });

  app.patch("/api/quote-requests/:id", protect, async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await storage.updateQuoteRequest(id, data);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to update quote request:", error);
      res.status(500).json({ error: error.message || "Failed to update quote request" });
    }
  });

  app.delete("/api/quote-requests/:id", protect, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteQuoteRequest(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Failed to delete quote request:", error);
      res.status(500).json({ error: error.message || "Failed to delete quote request" });
    }
  });
}
