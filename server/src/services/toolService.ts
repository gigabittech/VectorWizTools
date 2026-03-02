import { storage, ToolWithCms } from "../data/storage";
import { InsertTool, Tool } from "@shared/schema";

export class ToolService {
    async getAllTools(onlyActive?: boolean): Promise<ToolWithCms[]> {
        return await storage.getTools(onlyActive);
    }

    async getToolById(id: string): Promise<ToolWithCms | null> {
        return await storage.getTool(id);
    }

    async getToolByToolId(toolId: string): Promise<ToolWithCms | null> {
        return await storage.getToolByToolId(toolId);
    }

    async getToolBySlug(slug: string): Promise<ToolWithCms | null> {
        return await storage.getToolBySlug(slug);
    }

    async createTool(toolData: InsertTool): Promise<Tool> {
        return await storage.createTool(toolData);
    }

    async updateTool(id: string, toolData: Partial<InsertTool>): Promise<Tool> {
        return await storage.updateTool(id, toolData);
    }

    async deleteTool(id: string): Promise<void> {
        return await storage.deleteTool(id);
    }
}

export const toolService = new ToolService();
