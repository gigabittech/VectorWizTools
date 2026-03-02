import {
    quoteRequests,
    aiImageGenerations,
    users,
    type QuoteRequest,
    type InsertQuoteRequest,
    type AIImageGeneration,
    type InsertAIImageGeneration,
    type User,
    type InsertUser,
    type Tool,
    type InsertTool,
    type ToolSeo as ToolSeoType,
    type ToolContents as ToolContentsType,
    type ToolFaq as ToolFaqType,
    type ToolInternalLink as ToolInternalLinkType,
    type Page,
    type Blog,
    type Redirect,
    type SeoSettings,
    tools,
    toolSeo,
    toolContents,
    toolFaqs,
    toolInternalLinks,
    pages,
    blogs,
    redirects,
    seoSettings
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, and } from "drizzle-orm";

export type ToolWithCms = Tool & {
    seo?: ToolSeoType | null;
    contents?: ToolContentsType | null;
    faqs?: ToolFaqType[];
    internalLinks?: (ToolInternalLinkType & { relatedTool?: Tool })[];
};

export interface IStorage {
    // Quote Requests
    createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest>;
    getAllQuoteRequests(limit?: number): Promise<QuoteRequest[]>;

    // AI Image Generations
    createAIImageGeneration(generation: InsertAIImageGeneration): Promise<AIImageGeneration>;
    getAllAIImageGenerations(limit?: number): Promise<AIImageGeneration[]>;
    getAIImageGenerationById(id: string): Promise<AIImageGeneration | null>;

    // Users
    getUser(id: string): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    createUser(user: InsertUser): Promise<User>;
    updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

    // Tools
    getTools(onlyActive?: boolean): Promise<ToolWithCms[]>;
    getTool(id: string): Promise<ToolWithCms | null>;
    getToolByToolId(toolId: string): Promise<ToolWithCms | null>;
    getToolBySlug(slug: string): Promise<ToolWithCms | null>;
    createTool(tool: InsertTool): Promise<Tool>;
    updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool>;
    deleteTool(id: string): Promise<void>;

    // CMS Tables
    createToolSeo(data: any): Promise<ToolSeoType>;
    updateToolSeo(toolId: string, data: any): Promise<ToolSeoType>;
    createToolContents(data: any): Promise<ToolContentsType>;
    updateToolContents(toolId: string, data: any): Promise<ToolContentsType>;
    getToolFaqs(toolId: string): Promise<ToolFaqType[]>;
    createToolFaq(data: any): Promise<ToolFaqType>;
    updateToolFaq(id: string, data: any): Promise<ToolFaqType>;
    deleteToolFaq(id: string): Promise<void>;

    // Internal Links
    getToolInternalLinks(toolId: string): Promise<(ToolInternalLinkType & { relatedTool?: Tool })[]>;
    createToolInternalLink(data: any): Promise<ToolInternalLinkType>;
    deleteToolInternalLink(id: string): Promise<void>;

    // Global SEO Settings
    getSeoSettings(): Promise<SeoSettings | null>;
    updateSeoSettings(data: any): Promise<SeoSettings>;

    // Redirects
    getAllRedirects(): Promise<Redirect[]>;
    createRedirect(data: any): Promise<Redirect>;
    updateRedirect(id: string, data: any): Promise<Redirect>;
    deleteRedirect(id: string): Promise<void>;
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

    async getUser(id: string): Promise<User | null> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return user || null;
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
        return user || null;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const [user] = await db
            .insert(users)
            .values(insertUser)
            .returning();
        return user;
    }

    async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User> {
        const [user] = await db
            .update(users)
            .set({ ...userUpdate, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user;
    }

    private async attachCmsData(tool: Tool): Promise<ToolWithCms> {
        const [seo] = await db.select().from(toolSeo).where(eq(toolSeo.toolId, tool.id)).limit(1);
        const [contents] = await db.select().from(toolContents).where(eq(toolContents.toolId, tool.id)).limit(1);
        const faqs = await db.select().from(toolFaqs).where(eq(toolFaqs.toolId, tool.id)).orderBy(toolFaqs.sortOrder);
        const internalLinks = await this.getToolInternalLinks(tool.id);

        return {
            ...tool,
            seo: seo || null,
            contents: contents || null,
            faqs: faqs || [],
            internalLinks: internalLinks || []
        };
    }

    async getTools(onlyActive?: boolean): Promise<ToolWithCms[]> {
        let query = db.select().from(tools);
        if (onlyActive) {
            query = query.where(eq(tools.is_active, 'active')) as any;
        }
        const allTools = await query.orderBy(desc(tools.createdAt));
        return Promise.all(allTools.map(t => this.attachCmsData(t)));
    }

    async getTool(id: string): Promise<ToolWithCms | null> {
        const [tool] = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
        if (!tool) return null;
        return this.attachCmsData(tool);
    }

    async getToolByToolId(toolId: string): Promise<ToolWithCms | null> {
        const [tool] = await db.select().from(tools).where(eq(tools.tool_id, toolId)).limit(1);
        if (!tool) return null;
        return this.attachCmsData(tool);
    }

    async getToolBySlug(slug: string): Promise<ToolWithCms | null> {
        const [tool] = await db.select().from(tools).where(eq(tools.slug, slug)).limit(1);
        if (!tool) return null;
        return this.attachCmsData(tool);
    }

    async createTool(insertTool: InsertTool): Promise<Tool> {
        const [tool] = await db.insert(tools).values(insertTool).returning();
        return tool;
    }

    async updateTool(id: string, toolUpdate: Partial<InsertTool>): Promise<Tool> {
        const [updatedTool] = await db
            .update(tools)
            .set({ ...toolUpdate, updatedAt: new Date() })
            .where(eq(tools.id, id))
            .returning();
        return updatedTool;
    }

    async deleteTool(id: string): Promise<void> {
        await db.delete(tools).where(eq(tools.id, id));
    }

    // CMS Table Methods
    async createToolSeo(data: any): Promise<ToolSeoType> {
        const [res] = await db.insert(toolSeo).values(data).returning();
        return res;
    }

    async updateToolSeo(toolId: string, data: any): Promise<ToolSeoType> {
        const [existing] = await db.select().from(toolSeo).where(eq(toolSeo.toolId, toolId)).limit(1);
        if (existing) {
            const [res] = await db.update(toolSeo).set({ ...data, updatedAt: new Date() }).where(eq(toolSeo.toolId, toolId)).returning();
            return res;
        } else {
            const [res] = await db.insert(toolSeo).values({ ...data, toolId, updatedAt: new Date() }).returning();
            return res;
        }
    }

    async createToolContents(data: any): Promise<ToolContentsType> {
        const [res] = await db.insert(toolContents).values(data).returning();
        return res;
    }

    async updateToolContents(toolId: string, data: any): Promise<ToolContentsType> {
        const [existing] = await db.select().from(toolContents).where(eq(toolContents.toolId, toolId)).limit(1);
        if (existing) {
            const [res] = await db.update(toolContents).set({ ...data, updatedAt: new Date() }).where(eq(toolContents.toolId, toolId)).returning();
            return res;
        } else {
            const [res] = await db.insert(toolContents).values({ ...data, toolId, updatedAt: new Date() }).returning();
            return res;
        }
    }

    async getToolFaqs(toolId: string): Promise<ToolFaqType[]> {
        return db.select().from(toolFaqs).where(eq(toolFaqs.toolId, toolId)).orderBy(toolFaqs.sortOrder);
    }

    async createToolFaq(data: any): Promise<ToolFaqType> {
        const [res] = await db.insert(toolFaqs).values(data).returning();
        return res;
    }

    async updateToolFaq(id: string, data: any): Promise<ToolFaqType> {
        const [res] = await db.update(toolFaqs).set({ ...data, updatedAt: new Date() }).where(eq(toolFaqs.id, id)).returning();
        return res;
    }

    async deleteToolFaq(id: string): Promise<void> {
        await db.delete(toolFaqs).where(eq(toolFaqs.id, id));
    }

    // Internal Links
    async getToolInternalLinks(toolId: string): Promise<(ToolInternalLinkType & { relatedTool?: Tool })[]> {
        const links = await db.select().from(toolInternalLinks).where(eq(toolInternalLinks.toolId, toolId));
        return Promise.all(links.map(async link => {
            const [relatedTool] = await db.select().from(tools).where(eq(tools.id, link.relatedToolId)).limit(1);
            return {
                ...link,
                relatedTool: relatedTool || undefined
            };
        }));
    }

    async createToolInternalLink(data: any): Promise<ToolInternalLinkType> {
        const [res] = await db.insert(toolInternalLinks).values(data).returning();
        return res;
    }

    async deleteToolInternalLink(id: string): Promise<void> {
        await db.delete(toolInternalLinks).where(eq(toolInternalLinks.id, id));
    }

    // Global SEO Settings
    async getSeoSettings(): Promise<SeoSettings | null> {
        const [settings] = await db.select().from(seoSettings).limit(1);
        return settings || null;
    }

    async updateSeoSettings(data: any): Promise<SeoSettings> {
        const [existing] = await db.select().from(seoSettings).limit(1);
        if (existing) {
            const [updated] = await db.update(seoSettings)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(seoSettings.id, existing.id))
                .returning();
            return updated;
        } else {
            const [created] = await db.insert(seoSettings)
                .values({ ...data, updatedAt: new Date() })
                .returning();
            return created;
        }
    }

    // Redirects
    async getAllRedirects(): Promise<Redirect[]> {
        return db.select().from(redirects).orderBy(desc(redirects.createdAt));
    }

    async createRedirect(data: any): Promise<Redirect> {
        const [res] = await db.insert(redirects).values(data).returning();
        return res;
    }

    async updateRedirect(id: string, data: any): Promise<Redirect> {
        const [res] = await db.update(redirects).set(data).where(eq(redirects.id, id)).returning();
        return res;
    }

    async deleteRedirect(id: string): Promise<void> {
        await db.delete(redirects).where(eq(redirects.id, id));
    }
}

export const storage = new DatabaseStorage();
