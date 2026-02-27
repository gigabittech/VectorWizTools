import { storage } from "../data/storage";
import { InsertTool, Tool } from "@shared/schema";

export class ToolService {
    async getAllTools(): Promise<Tool[]> {
        return await storage.getTools();
    }

    async getToolById(id: string): Promise<Tool | null> {
        return await storage.getTool(id);
    }

    async getToolByToolId(toolId: string): Promise<Tool | null> {
        return await storage.getToolByToolId(toolId);
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
