import { 
  quoteRequests,
  type QuoteRequest,
  type InsertQuoteRequest
} from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  // Quote Requests
  createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest>;
  getAllQuoteRequests(limit?: number): Promise<QuoteRequest[]>;
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
}

export const storage = new DatabaseStorage();
