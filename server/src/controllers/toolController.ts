import { Request, Response } from "express";
import { toolService } from "../services/toolService";
import { insertToolSchema } from "@shared/schema";
import { z } from "zod";

export class ToolController {
    async getAllTools(req: Request, res: Response) {
        try {
            const onlyActive = req.query.onlyActive === 'true';
            const tools = await toolService.getAllTools(onlyActive);
            res.json(tools);
        } catch (error) {
            console.error("Error fetching tools:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getTool(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const tool = await toolService.getToolById(id);
            if (!tool) {
                return res.status(404).json({ message: "Tool not found" });
            }
            res.json(tool);
        } catch (error) {
            console.error("Error fetching tool:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getToolByToolId(req: Request, res: Response) {
        try {
            const { toolId } = req.params;
            const tool = await toolService.getToolByToolId(toolId);
            if (!tool) {
                return res.status(404).json({ message: "Tool not found" });
            }
            res.json(tool);
        } catch (error) {
            console.error("Error fetching tool by ID:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getToolBySlug(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const tool = await toolService.getToolBySlug(slug);
            if (!tool) {
                return res.status(404).json({ message: "Tool not found" });
            }
            res.json(tool);
        } catch (error) {
            console.error("Error fetching tool by slug:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async createTool(req: Request, res: Response) {
        try {
            const data = insertToolSchema.parse(req.body);
            const tool = await toolService.createTool(data);
            res.status(201).json(tool);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid tool data", errors: error.errors });
            }
            console.error("Error creating tool:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async updateTool(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = insertToolSchema.partial().parse(req.body);
            const tool = await toolService.updateTool(id, data);
            res.json(tool);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid tool data", errors: error.errors });
            }
            console.error("Error updating tool:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async deleteTool(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await toolService.deleteTool(id);
            res.status(204).send();
        } catch (error) {
            console.error("Error deleting tool:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export const toolController = new ToolController();
