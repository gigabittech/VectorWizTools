import { 
  quoteRequests,
  aiImageGenerations,
  type QuoteRequest,
  type InsertQuoteRequest,
  type AIImageGeneration,
  type InsertAIImageGeneration
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  // Quote Requests
  createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest>;
  getAllQuoteRequests(limit?: number): Promise<QuoteRequest[]>;
  
  // AI Image Generations
  createAIImageGeneration(generation: InsertAIImageGeneration): Promise<AIImageGeneration>;
  getAllAIImageGenerations(limit?: number): Promise<AIImageGeneration[]>;
  getAIImageGenerationById(id: string): Promise<AIImageGeneration | null>;
}

export class DatabaseStorage implements IStorage {
  async createQuoteRequest(insertQuoteRequest: InsertQuoteRequest): Promise<QuoteRequest> {
    const [quoteRequest] = await db
      .insert(quoteRequests)
      .values(insertQuoteRequest)
      .returning();
    return quoteRequest;
  }

  async getAllQuoteRequests(limit = 100): Promise<QuoteRequest[]> {
    return await db
      .select()
      .from(quoteRequests)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(limit);
  }

  async createAIImageGeneration(generation: InsertAIImageGeneration): Promise<AIImageGeneration> {
    const [result] = await db
      .insert(aiImageGenerations)
      .values(generation)
      .returning();
    return result;
  }

  async getAllAIImageGenerations(limit = 100): Promise<AIImageGeneration[]> {
    return await db
      .select()
      .from(aiImageGenerations)
      .orderBy(desc(aiImageGenerations.createdAt))
      .limit(limit);
  }

  async getAIImageGenerationById(id: string): Promise<AIImageGeneration | null> {
    const [result] = await db
      .select()
      .from(aiImageGenerations)
      .where(eq(aiImageGenerations.id, id))
      .limit(1);
    return result || null;
  }
}

export const storage = new DatabaseStorage();
