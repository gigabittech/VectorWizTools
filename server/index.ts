import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Support subpath deployment (e.g., BASE_PATH=/tools for abc.com/tools)
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Trust proxy for subpath deployment behind Nginx/Apache
app.set('trust proxy', true);

// If deployed at a subpath, re-map /BASE_PATH/... -> /...
if (BASE_PATH) {
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
        // Paths without /tools prefix pass through unchanged

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

        res.status(status).json({ message });
        throw err;
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