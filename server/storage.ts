import { 
  users, 
  orders, 
  files, 
  messages, 
  proofs, 
  sessions,
  activities,
  type User, 
  type InsertUser,
  type Order,
  type InsertOrder,
  type File,
  type InsertFile,
  type Message,
  type InsertMessage,
  type Proof,
  type InsertProof,
  type Activity,
  type InsertActivity,
  type Session
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Sessions
  createSession(userId: string, refreshJti: string, expiresAt: Date): Promise<Session>;
  getSessionByRefreshJti(refreshJti: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder & { userId: string | null }): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  
  // Files
  createFile(file: InsertFile & { userId: string }): Promise<File>;
  getFile(id: string): Promise<File | undefined>;
  getFilesByOrder(orderId: string): Promise<File[]>;
  getFilesByUser(userId: string): Promise<File[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByOrder(orderId: string): Promise<Message[]>;
  
  // Proofs
  createProof(proof: InsertProof): Promise<Proof>;
  getProofsByOrder(orderId: string): Promise<Proof[]>;
  updateProof(id: string, updates: Partial<Proof>): Promise<Proof | undefined>;
  
  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUser(userId: string, limit?: number): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  
  // Admin Analytics
  getOrderStats(): Promise<{ total: number; byStatus: Record<string, number>; byService: Record<string, number> }>;
  getUserStats(): Promise<{ total: number; byRole: Record<string, number> }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Sessions
  async createSession(userId: string, refreshJti: string, expiresAt: Date): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({ userId, refreshJti, expiresAt })
      .returning();
    return session;
  }

  async getSessionByRefreshJti(refreshJti: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.refreshJti, refreshJti));
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // Orders
  async createOrder(order: InsertOrder & { userId: string | null }): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values([order])
      .returning();
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  // Files
  async createFile(file: InsertFile & { userId: string }): Promise<File> {
    const [newFile] = await db
      .insert(files)
      .values([file])
      .returning();
    return newFile;
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByOrder(orderId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.orderId, orderId))
      .orderBy(desc(files.createdAt));
  }

  async getFilesByUser(userId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesByOrder(orderId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(desc(messages.createdAt));
  }

  // Proofs
  async createProof(proof: InsertProof): Promise<Proof> {
    const [newProof] = await db
      .insert(proofs)
      .values(proof)
      .returning();
    return newProof;
  }

  async getProofsByOrder(orderId: string): Promise<Proof[]> {
    return await db
      .select()
      .from(proofs)
      .where(eq(proofs.orderId, orderId))
      .orderBy(desc(proofs.createdAt));
  }

  async updateProof(id: string, updates: Partial<Proof>): Promise<Proof | undefined> {
    const [updated] = await db
      .update(proofs)
      .set(updates)
      .where(eq(proofs.id, id))
      .returning();
    return updated || undefined;
  }

  // Admin Analytics
  async getOrderStats(): Promise<{ total: number; byStatus: Record<string, number>; byService: Record<string, number> }> {
    const allOrders = await this.getAllOrders();
    
    const stats = {
      total: allOrders.length,
      byStatus: {} as Record<string, number>,
      byService: {} as Record<string, number>
    };

    allOrders.forEach(order => {
      // Count by status
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      
      // Count by service
      stats.byService[order.service] = (stats.byService[order.service] || 0) + 1;
    });

    return stats;
  }

  async getUserStats(): Promise<{ total: number; byRole: Record<string, number> }> {
    const allUsers = await db.select().from(users);
    
    const stats = {
      total: allUsers.length,
      byRole: {} as Record<string, number>
    };

    allUsers.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    return stats;
  }

  // Activities
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values([activity])
      .returning();
    return newActivity;
  }

  async getActivitiesByUser(userId: string, limit: number = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
