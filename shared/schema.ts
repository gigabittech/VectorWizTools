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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  service: serviceTypeEnum("service").notNull(),
  status: orderStatusEnum("status").default("QUEUED").notNull(),
  notes: text("notes"),
  priceCents: integer("price_cents"),
  currency: text("currency").default("USD").notNull(),
  paypalOrderId: text("paypal_order_id"),
  timeline: json("timeline").default(sql`'[]'::json`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: json("metadata").default(sql`'{}'::json`).notNull(),
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
