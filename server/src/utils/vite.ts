import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../../../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    base: "/", // Important: set to / because Express strips the BASE_PATH prefix
    server: serverOptions,
    appType: "custom",
  });

  // Only use Vite middleware for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      // Skip Vite middleware for API routes
      return next();
    }
    vite.middlewares(req, res, next);
  });

  // Catch-all for non-API routes only
  app.use("*", async (req, res, next) => {
    // Skip API routes - they should have been handled by registerRoutes
    if (req.path.startsWith("/api")) {
      return next();
    }

    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const basePath = (process.env.BASE_PATH || "").replace(/\/$/, "");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="${basePath}/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    // Fallback for different deployment structures
    const fallbackPath = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "public");
    const bundledPath = path.resolve(import.meta.dirname, "public");

    if (fs.existsSync(fallbackPath)) {
      return doServe(app, fallbackPath);
    } else if (fs.existsSync(bundledPath)) {
      return doServe(app, bundledPath);
    }

    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  doServe(app, distPath);
}

function doServe(app: Express, distPath: string) {
  // Serve static files (excluding API routes)
  const staticMiddleware = express.static(distPath);
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    staticMiddleware(req, res, next);
  });

  // fall through to index.html if the file doesn't exist (but not for API routes)
  app.use("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}