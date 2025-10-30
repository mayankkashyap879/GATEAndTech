import type { Express, Request, Response } from "express";
import { pool } from "../db.js";
import { redis, isRedisAvailable } from "../redis.js";

export function healthRoutes(app: Express): void {
  app.get("/api/health", async (_req: Request, res: Response) => {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: "unknown",
        redis: "unknown",
        workers: "unknown",
      },
    };

    try {
      await pool.query("SELECT 1");
      health.services.database = "healthy";
    } catch (error) {
      health.services.database = "unhealthy";
      health.status = "degraded";
    }

    if (redis && isRedisAvailable) {
      try {
        await redis.ping();
        health.services.redis = "healthy";
      } catch (error) {
        health.services.redis = "unhealthy";
      }
    } else {
      health.services.redis = "not_configured";
    }

    health.services.workers = redis && isRedisAvailable ? "healthy" : "not_configured";

    const statusCode = health.status === "ok" ? 200 : 503;
    res.status(statusCode).json(health);
  });

  app.get("/api/health/ready", async (_req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
      res.status(200).json({ ready: true });
    } catch (error) {
      res.status(503).json({ ready: false, error: "Database not ready" });
    }
  });

  app.get("/api/health/live", (_req: Request, res: Response) => {
    res.status(200).json({ alive: true });
  });
}
