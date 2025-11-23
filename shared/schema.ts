import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple quote requests table
export const quoteRequests = pgTable("quote_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  projectDetails: text("project_details").notNull(),
  numberOfFiles: text("number_of_files"),
  turnaroundTime: text("turnaround_time"),
  fileUrls: text("file_urls").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  projectDetails: z.string().min(10, "Please provide project details (minimum 10 characters)"),
  numberOfFiles: z.string().optional(),
  turnaroundTime: z.string().optional(),
});

// AI Image Generations table
export const aiImageGenerations = pgTable("ai_image_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  model: varchar("model").notNull(), // "dall-e-3", "dall-e-2", "stable-diffusion"
  size: varchar("size"), // "1024x1024", etc.
  quality: varchar("quality"), // "standard", "hd"
  style: varchar("style"), // "vivid", "natural"
  imageUrl: text("image_url").notNull(),
  provider: varchar("provider").notNull(), // "openai", "stability-ai", "replicate"
  costCents: integer("cost_cents"), // Cost in cents for tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas for AI Image Generations
export const insertAIImageGenerationSchema = createInsertSchema(aiImageGenerations).omit({
  id: true,
  createdAt: true,
}).extend({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  model: z.enum(["dall-e-3", "dall-e-2", "stable-diffusion"]),
  imageUrl: z.string().url("Valid image URL is required"),
  provider: z.enum(["openai", "stability-ai", "replicate"]),
});

// Types
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type AIImageGeneration = typeof aiImageGenerations.$inferSelect;
export type InsertAIImageGeneration = z.infer<typeof insertAIImageGenerationSchema>;
