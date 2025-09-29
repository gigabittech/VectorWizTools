import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { storage } from "./storage";
import { 
  authMiddleware, 
  adminMiddleware, 
  designerMiddleware,
  hashPassword, 
  verifyPassword, 
  signAccess, 
  signRefresh, 
  verifyRefresh,
  setAuthCookies,
  clearAuthCookies,
  type AuthRequest 
} from "./auth";
import { 
  loginSchema, 
  signupSchema, 
  insertOrderSchema,
  guestOrderSchema, 
  insertMessageSchema,
  insertFileSchema,
  insertProofSchema 
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { randomUUID } from "crypto";
import { ActivityLogger } from "./activityLogger";
import { analyzeImageFromBuffer } from "./imageAnalysis";
import { calculatePricing, calculateBulkPricing, getBasePriceForService } from "./pricingEngine";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        hashedPassword,
        name: data.name,
      });

      // Create session
      const refreshJti = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await storage.createSession(user.id, refreshJti, expiresAt);

      // Generate tokens
      const accessToken = signAccess(user.id, user.role);
      const refreshToken = signRefresh(user.id, refreshJti);

      setAuthCookies(res, accessToken, refreshToken);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Invalid signup data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(data.password, user.hashedPassword);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session
      const refreshJti = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await storage.createSession(user.id, refreshJti, expiresAt);

      // Generate tokens
      const accessToken = signAccess(user.id, user.role);
      const refreshToken = signRefresh(user.id, refreshJti);

      setAuthCookies(res, accessToken, refreshToken);

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token" });
      }

      const payload = verifyRefresh(refreshToken);
      if (!payload || !payload.sub || !payload.jti) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const session = await storage.getSessionByRefreshJti(payload.jti);
      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ error: "Session expired" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Delete old session and create new one
      await storage.deleteSession(session.id);
      const newRefreshJti = randomUUID();
      const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await storage.createSession(user.id, newRefreshJti, newExpiresAt);

      // Generate new tokens
      const newAccessToken = signAccess(user.id, user.role);
      const newRefreshToken = signRefresh(user.id, newRefreshJti);

      setAuthCookies(res, newAccessToken, newRefreshToken);

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(401).json({ error: "Token refresh failed" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        const payload = verifyRefresh(refreshToken);
        if (payload?.jti) {
          const session = await storage.getSessionByRefreshJti(payload.jti);
          if (session) {
            await storage.deleteSession(session.id);
          }
        }
      }

      clearAuthCookies(res);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({ 
      user: { 
        id: req.user.id, 
        email: req.user.email, 
        name: req.user.name, 
        role: req.user.role 
      } 
    });
  });

  // PayPal Proxy Routes (for PayPalButton component compatibility)
  app.get("/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", authMiddleware, async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/order/:orderID/capture", authMiddleware, async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // PayPal Routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", authMiddleware, async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", authMiddleware, async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Guest PayPal Routes (no authentication required)
  app.post("/api/paypal/guest/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/guest/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Order Routes
  app.post("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertOrderSchema.parse(req.body);
      
      const order = await storage.createOrder({
        ...data,
        userId: req.user!.id,
      });

      // Log activity for order creation
      await ActivityLogger.logOrderCreated(
        req.user!.id,
        order.id,
        order.service
      );

      res.json({ order });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  // Guest Order Routes (no authentication required)
  app.post("/api/orders/guest", async (req, res) => {
    try {
      const data = guestOrderSchema.parse(req.body);
      
      const order = await storage.createOrder({
        ...data,
        userId: null, // Guest orders have no userId
      });

      // Skip activity logging for guest orders (no user ID)

      res.json({ order });
    } catch (error) {
      console.error("Create guest order error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.get("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      res.json({ orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check ownership or admin/designer access
      if (order.userId !== req.user!.id && !["ADMIN", "DESIGNER"].includes(req.user!.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id", designerMiddleware, async (req: AuthRequest, res) => {
    try {
      const updates = req.body;
      const existingOrder = await storage.getOrder(req.params.id);
      
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = await storage.updateOrder(req.params.id, updates);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Log activity for status changes (only for user orders)
      if (updates.status && updates.status !== existingOrder.status && order.userId) {
        await ActivityLogger.logOrderUpdated(
          order.userId,
          order.id,
          updates.status,
          existingOrder.status
        );
      }

      res.json({ order });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // File Routes
  app.post("/api/files/presign", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("File presign error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/files", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertFileSchema.parse(req.body);
      
      const file = await storage.createFile({
        ...data,
        userId: req.user!.id,
      });

      // Set ACL policy for the uploaded file
      if (data.storageKey) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.trySetObjectEntityAclPolicy(data.storageKey, {
            owner: req.user!.id,
            visibility: "private",
          });
        } catch (aclError) {
          console.error("ACL policy error:", aclError);
          // Don't fail the request if ACL fails
        }
      }

      // Log activity for file upload
      if (file.orderId) {
        await ActivityLogger.logFileUploaded(
          req.user!.id,
          file.orderId,
          file.name,
          file.kind
        );
      }

      res.json({ file });
    } catch (error) {
      console.error("Create file error:", error);
      res.status(400).json({ error: "Invalid file data" });
    }
  });

  app.get("/api/files", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const files = await storage.getFilesByUser(req.user!.id);
      res.json({ files });
    } catch (error) {
      console.error("Get files error:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Message Routes
  app.post("/api/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage({
        ...data,
        userId: req.user!.id,
      });

      // Broadcast message via WebSocket
      broadcastMessage(data.orderId, message);

      // Log activity for message sent
      await ActivityLogger.logMessageSent(
        req.user!.id,
        data.orderId,
        data.body
      );

      res.json({ message });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.get("/api/messages/:orderId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const orderId = req.params.orderId;
      
      // Verify access to order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.userId !== req.user!.id && !["ADMIN", "DESIGNER"].includes(req.user!.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getMessagesByOrder(orderId);
      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Proof Routes
  app.post("/api/proofs", designerMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertProofSchema.parse(req.body);
      
      const proof = await storage.createProof(data);

      // Get the order to find the client user ID for activity logging
      const order = await storage.getOrder(data.orderId);
      if (order && order.userId) {
        await ActivityLogger.logProofUploaded(
          order.userId, // Log activity for the client, not the designer
          data.orderId
        );
      }

      res.json({ proof });
    } catch (error) {
      console.error("Create proof error:", error);
      res.status(400).json({ error: "Invalid proof data" });
    }
  });

  app.get("/api/proofs/:orderId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const orderId = req.params.orderId;
      
      // Verify access to order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.userId !== req.user!.id && !["ADMIN", "DESIGNER"].includes(req.user!.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const proofs = await storage.getProofsByOrder(orderId);
      res.json({ proofs });
    } catch (error) {
      console.error("Get proofs error:", error);
      res.status(500).json({ error: "Failed to fetch proofs" });
    }
  });

  // Object Storage Routes
  app.get("/objects/:objectPath(*)", authMiddleware, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Tool Routes (for turnaround estimation)
  app.post("/api/tools/turnaround", async (req, res) => {
    try {
      const { service, complexity = "medium", fileCount = 1 } = req.body;
      
      // Simple turnaround calculation
      const baseTimes = {
        IMAGE_TO_VECTOR: 2,
        LOGO_VECTORIZATION: 3,
        PDF_TO_VECTOR: 1.5,
        DXF_CUTTER_READY: 4,
        RASTER_TO_VECTOR: 2.5,
      };

      const complexityMultipliers = {
        simple: 0.7,
        medium: 1.0,
        complex: 1.5,
      };

      const baseTime = baseTimes[service as keyof typeof baseTimes] || 2;
      const multiplier = complexityMultipliers[complexity as keyof typeof complexityMultipliers] || 1;
      const fileMultiplier = Math.min(fileCount * 0.5 + 0.5, 3); // Max 3x for multiple files

      const estimatedDays = Math.ceil(baseTime * multiplier * fileMultiplier);
      
      res.json({ estimatedDays });
    } catch (error) {
      console.error("Turnaround estimation error:", error);
      res.status(500).json({ error: "Failed to estimate turnaround" });
    }
  });

  // Admin Routes
  app.get("/api/admin/orders", adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json({ orders });
    } catch (error) {
      console.error("Admin get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/analytics/orders", adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin order analytics error:", error);
      res.status(500).json({ error: "Failed to fetch order analytics" });
    }
  });

  app.get("/api/admin/analytics/users", adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin user analytics error:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // Activity Routes
  app.get("/api/activities", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const activities = await storage.getActivitiesByUser(req.user!.id);
      res.json({ activities });
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/admin/activities", adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getRecentActivities(limit);
      res.json({ activities });
    } catch (error) {
      console.error("Get admin activities error:", error);
      res.status(500).json({ error: "Failed to fetch recent activities" });
    }
  });

  // Image Analysis Routes
  app.post("/api/analysis/image", async (req, res) => {
    try {
      // Expect base64 encoded image data
      const { imageData, fileName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const analysis = await analyzeImageFromBuffer(buffer);
      
      res.json({ analysis });
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Pricing Calculation Routes
  app.post("/api/pricing/calculate", async (req, res) => {
    try {
      const config = req.body;
      
      if (!config.serviceType) {
        return res.status(400).json({ error: "Service type is required" });
      }

      const pricing = await calculatePricing(config);
      res.json({ pricing });
    } catch (error) {
      console.error("Pricing calculation error:", error);
      res.status(500).json({ error: "Failed to calculate pricing" });
    }
  });

  app.post("/api/pricing/bulk", async (req, res) => {
    try {
      const { configs } = req.body;
      
      if (!configs || !Array.isArray(configs)) {
        return res.status(400).json({ error: "Configs array is required" });
      }

      const result = await calculateBulkPricing(configs);
      res.json({ result });
    } catch (error) {
      console.error("Bulk pricing calculation error:", error);
      res.status(500).json({ error: "Failed to calculate bulk pricing" });
    }
  });

  app.get("/api/pricing/base/:serviceType", async (req, res) => {
    try {
      const { serviceType } = req.params;
      const basePrice = getBasePriceForService(serviceType);
      res.json({ basePrice });
    } catch (error) {
      console.error("Get base price error:", error);
      res.status(500).json({ error: "Failed to get base price" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket Setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribe' && message.orderId) {
          if (!connections.has(message.orderId)) {
            connections.set(message.orderId, new Set());
          }
          connections.get(message.orderId)!.add(ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from all order subscriptions
      connections.forEach((orderConnections) => {
        orderConnections.delete(ws);
      });
    });
  });

  function broadcastMessage(orderId: string, message: any) {
    const orderConnections = connections.get(orderId);
    if (orderConnections) {
      const data = JSON.stringify({ type: 'message', data: message });
      orderConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }
  }

  return httpServer;
}
