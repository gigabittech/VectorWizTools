import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

// --- Boot-time Environment Variable Validation ---
// Fail loudly if required env vars are missing, rather than crashing on first user request.
const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    CLOUDCONVERT_API_KEY: z.string().min(1, "CLOUDCONVERT_API_KEY is required"),
    FRONTEND_URL: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    PORT: z.string().optional(),
    HOST: z.string().optional(),
    BASE_PATH: z.string().optional(),
    PROXY_STRIPS_PREFIX: z.string().optional(),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error("❌ Missing or invalid environment variables:");
    const formatted = envResult.error.format();
    Object.entries(formatted).forEach(([key, val]) => {
        if (key !== "_errors" && val && typeof val === "object" && "_errors" in val) {
            const errs = (val as any)._errors;
            if (errs.length) console.error(`  - ${key}: ${errs.join(", ")}`);
        }
    });
    process.exit(1); // Refuse to start with invalid config
}

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Support subpath deployment (e.g., BASE_PATH=/tools for abc.com/tools)
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");

// If proxy (Apache/Nginx) already strips the prefix, set this to skip re-stripping
const PROXY_STRIPS_PREFIX = process.env.PROXY_STRIPS_PREFIX === "true" || BASE_PATH === "";

import path from "path";
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve uploads directory statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Trust proxy for subpath deployment behind Nginx/Apache
app.set('trust proxy', true);

// Only strip BASE_PATH if proxy doesn't already do it
if (BASE_PATH && !PROXY_STRIPS_PREFIX) {
    app.use((req, res, next) => {
        const originalUrl = req.originalUrl || req.url;

        // Handle /tools and /tools/ as root
        if (originalUrl === BASE_PATH || originalUrl === BASE_PATH + "/") {
            req.url = "/";
        }
        // Strip /tools prefix from all other paths
        else if (originalUrl.startsWith(BASE_PATH + "/")) {
            req.url = originalUrl.slice(BASE_PATH.length);
        }

        // Debug logging
        if (originalUrl.includes('api')) {
            console.log(`[BASE_PATH] ${originalUrl} -> ${req.url}`);
        }

        next();
    });
}

app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
        }
    });

    next();
});

(async () => {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        // Log the error for debugging, but don't crash the server
        console.error(`[Error Handler] ${status}: ${message}`, err);

        if (!res.headersSent) {
            res.status(status).json({ message });
        }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    // Use 127.0.0.1 (IPv4) instead of 0.0.0.0 or localhost to avoid IPv6 resolution issues on macOS
    const host = process.env.HOST || '127.0.0.1';
    server.listen(port, host, () => {
        log(`serving on url http://${host}:${port}${BASE_PATH || ""}`);
    });
})();