import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple quote requests table
export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  id: uuid("id").primaryKey().defaultRandom(),
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

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, seo, writer
  name: text("name"),
  email: text("email").unique(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Valid email is required").optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Tools table
export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  tool_id: varchar("tool_id").notNull().unique(), // Existing slug-like ID
  name: text("name").notNull(),
  title: text("title"),
  description: text("description"),
  category: text("category").notNull(),
  keywords: text("keywords").array(),
  howToSteps: text("how_to_steps").array(),
  status: text("status").notNull().default("active"),

  // NEW COLUMNS FOR CMS
  slug: varchar("slug").unique(),
  tool_component: text("tool_component"),
  is_active: text("is_active").default("active"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// 2. tool_seo
export const toolSeo = pgTable("tool_seo", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  indexStatus: text("index_status").default("index"), // index / noindex
  followStatus: text("follow_status").default("follow"), // follow / nofollow
  schemaType: text("schema_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// 3. tool_contents
export const toolContents = pgTable("tool_contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id),
  h1Title: text("h1_title"),
  introContent: text("intro_content"),
  howToUse: text("how_to_use"),
  features: text("features"),
  bottomContent: text("bottom_content"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// 4. tool_faqs
export const toolFaqs = pgTable("tool_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// 5. tool_internal_links
export const toolInternalLinks = pgTable("tool_internal_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").notNull().references(() => tools.id),
  relatedToolId: uuid("related_tool_id").notNull().references(() => tools.id),
  anchorText: text("anchor_text").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// 6. pages
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  content: text("content"),
  indexStatus: text("index_status").default("index"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// 7. blogs
export const blogs = pgTable("blogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  content: text("content"),
  featuredImage: text("featured_image"),
  authorId: uuid("author_id").references(() => users.id),
  status: text("status").default("draft"), // draft / published
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// 8. redirects
export const redirects = pgTable("redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  oldUrl: text("old_url").notNull().unique(),
  newUrl: text("new_url").notNull(),
  redirectType: text("redirect_type").default("301"), // 301 / 302
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// 9. seo_settings
export const seoSettings = pgTable("seo_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  defaultMetaTitle: text("default_meta_title"),
  defaultMetaDescription: text("default_meta_description"),
  defaultOgImage: text("default_og_image"),
  sitemapEnabled: integer("sitemap_enabled").default(1), // 1=true, 0=false (using integer for simplicity in some drivers, or boolean if preferred)
  schemaEnabled: integer("schema_enabled").default(1),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type AIImageGeneration = typeof aiImageGenerations.$inferSelect;
export type InsertAIImageGeneration = z.infer<typeof insertAIImageGenerationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;

// New Types
export type ToolSeo = typeof toolSeo.$inferSelect;
export type ToolContents = typeof toolContents.$inferSelect;
export type ToolFaq = typeof toolFaqs.$inferSelect;
export type ToolInternalLink = typeof toolInternalLinks.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Blog = typeof blogs.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
export type SeoSettings = typeof seoSettings.$inferSelect;
