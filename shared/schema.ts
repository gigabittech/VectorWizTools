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

// Types
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
