import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["CLIENT", "ADMIN", "DESIGNER"]);
export const serviceTypeEnum = pgEnum("service_type", [
  "IMAGE_TO_VECTOR",
  "LOGO_VECTORIZATION", 
  "PDF_TO_VECTOR",
  "DXF_CUTTER_READY",
  "RASTER_TO_VECTOR"
]);
export const orderStatusEnum = pgEnum("order_status", [
  "QUEUED",
  "IN_PROGRESS", 
  "NEEDS_REVISION",
  "WAITING_PAYMENT",
  "COMPLETE",
  "CANCELED"
]);
export const fileKindEnum = pgEnum("file_kind", ["SOURCE", "UPLOAD", "PROOF", "FINAL"]);
export const activityTypeEnum = pgEnum("activity_type", ["ORDER_CREATED", "ORDER_UPDATED", "PAYMENT_PROCESSED", "FILE_UPLOADED", "PROOF_UPLOADED", "MESSAGE_SENT"]);
export const complexityTierEnum = pgEnum("complexity_tier", ["SIMPLE", "MEDIUM", "COMPLEX"]);
export const turnaroundTierEnum = pgEnum("turnaround_tier", ["STANDARD", "RUSH_24HR", "RUSH_12HR"]);
export const addonTypeEnum = pgEnum("addon_type", ["BACKGROUND_REMOVAL", "COLOR_CHANGE", "SIMPLIFICATION", "EXTRA_FORMATS"]);

// Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  name: text("name"),
  role: roleEnum("role").default("CLIENT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshJti: text("refresh_jti").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Now nullable for guest orders
  service: serviceTypeEnum("service").notNull(),
  status: orderStatusEnum("status").default("QUEUED").notNull(),
  notes: text("notes"),
  priceCents: integer("price_cents"),
  currency: text("currency").default("USD").notNull(),
  paypalOrderId: text("paypal_order_id"),
  timeline: json("timeline").default(sql`'[]'::json`).notNull(),
  // Guest contact information (for non-authenticated orders)
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  guestCompany: text("guest_company"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Now nullable for guest files
  kind: fileKindEnum("kind").notNull(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  checksum: text("checksum"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proofs = pgTable("proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  comment: text("comment"),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Now nullable for guest messages
  authorName: text("author_name"), // For guest or admin message authors
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").unique().notNull().references(() => orders.id, { onDelete: "cascade" }),
  paypalId: text("paypal_id").unique().notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Now nullable for guest activities
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: json("metadata").default(sql`'{}'::json`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complexityAnalyses = pgTable("complexity_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").references(() => files.id, { onDelete: "cascade" }).notNull(),
  resolutionScore: integer("resolution_score").notNull(),
  colorScore: integer("color_score").notNull(),
  detailScore: integer("detail_score").notNull(),
  backgroundScore: integer("background_score").notNull(),
  objectCountScore: integer("object_count_score").notNull(),
  qualityScore: integer("quality_score").notNull(),
  finalScore: integer("final_score").notNull(),
  complexityTier: complexityTierEnum("complexity_tier").notNull(),
  analysisData: json("analysis_data").default(sql`'{}'::json`).notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: serviceTypeEnum("service_type").notNull(),
  basePrice: integer("base_price").notNull(),
  complexityMultipliers: json("complexity_multipliers").notNull(),
  turnaroundMultipliers: json("turnaround_multipliers").notNull(),
  addonPrices: json("addon_prices").notNull(),
  active: boolean("active").default(true).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderLineItems = pgTable("order_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  fileId: varchar("file_id").references(() => files.id, { onDelete: "cascade" }),
  serviceType: serviceTypeEnum("service_type").notNull(),
  complexityTier: complexityTierEnum("complexity_tier"),
  basePrice: integer("base_price").notNull(),
  complexityAdjustment: integer("complexity_adjustment").default(0).notNull(),
  turnaroundFee: integer("turnaround_fee").default(0).notNull(),
  formatFees: integer("format_fees").default(0).notNull(),
  addonFees: integer("addon_fees").default(0).notNull(),
  subtotal: integer("subtotal").notNull(),
  itemOrder: integer("item_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderAddons = pgTable("order_addons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderLineItemId: varchar("order_line_item_id").references(() => orderLineItems.id, { onDelete: "cascade" }).notNull(),
  addonType: addonTypeEnum("addon_type").notNull(),
  price: integer("price").notNull(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  messages: many(messages),
  sessions: many(sessions),
  files: many(files),
  activities: many(activities),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  files: many(files),
  proofs: many(proofs),
  messages: many(messages),
  invoice: one(invoices),
}));

export const filesRelations = relations(files, ({ one }) => ({
  order: one(orders, {
    fields: [files.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
}));

export const proofsRelations = relations(proofs, ({ one }) => ({
  order: one(orders, {
    fields: [proofs.orderId],
    references: [orders.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [activities.orderId],
    references: [orders.id],
  }),
}));

export const complexityAnalysesRelations = relations(complexityAnalyses, ({ one }) => ({
  file: one(files, {
    fields: [complexityAnalyses.fileId],
    references: [files.id],
  }),
}));

export const orderLineItemsRelations = relations(orderLineItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderLineItems.orderId],
    references: [orders.id],
  }),
  file: one(files, {
    fields: [orderLineItems.fileId],
    references: [files.id],
  }),
  addons: many(orderAddons),
}));

export const orderAddonsRelations = relations(orderAddons, ({ one }) => ({
  lineItem: one(orderLineItems, {
    fields: [orderAddons.orderLineItemId],
    references: [orderLineItems.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  timeline: true,
  userId: true, // Server will add this from authenticated user
});

// Guest order schema for public order creation
export const guestOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  timeline: true,
  userId: true, // Guest orders don't have userId
}).extend({
  guestName: z.string().min(2, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
  guestPhone: z.string().optional(),
  guestCompany: z.string().optional(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  userId: true, // Server will add this from authenticated user
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertProofSchema = createInsertSchema(proofs).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertComplexityAnalysisSchema = createInsertSchema(complexityAnalyses).omit({
  id: true,
  analyzedAt: true,
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
});

export const insertOrderLineItemSchema = createInsertSchema(orderLineItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderAddonSchema = createInsertSchema(orderAddons).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Proof = typeof proofs.$inferSelect;
export type InsertProof = z.infer<typeof insertProofSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Session = typeof sessions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type GuestOrder = z.infer<typeof guestOrderSchema>;
export type ComplexityAnalysis = typeof complexityAnalyses.$inferSelect;
export type InsertComplexityAnalysis = z.infer<typeof insertComplexityAnalysisSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type OrderLineItem = typeof orderLineItems.$inferSelect;
export type InsertOrderLineItem = z.infer<typeof insertOrderLineItemSchema>;
export type OrderAddon = typeof orderAddons.$inferSelect;
export type InsertOrderAddon = z.infer<typeof insertOrderAddonSchema>;
