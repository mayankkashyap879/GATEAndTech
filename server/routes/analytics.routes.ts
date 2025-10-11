import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";

export function analyticsRoutes(app: Express): void {
  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  // Get user performance stats
  app.get("/api/analytics/performance", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const stats = await storage.getUserPerformanceStats(currentUser.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching performance stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get topic-wise performance
  app.get("/api/analytics/topics", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const topicPerformance = await storage.getTopicWisePerformance(currentUser.id);
      res.json(topicPerformance);
    } catch (error) {
      console.error("Error fetching topic performance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get difficulty-wise performance
  app.get("/api/analytics/difficulty", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const difficultyPerformance = await storage.getDifficultyWisePerformance(currentUser.id);
      res.json(difficultyPerformance);
    } catch (error) {
      console.error("Error fetching difficulty performance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get performance trend
  app.get("/api/analytics/trend", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const trend = await storage.getPerformanceTrend(currentUser.id, limit);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching performance trend:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get test history (already exists via getUserTestAttempts but exposed as analytics endpoint)
  app.get("/api/analytics/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const attempts = await storage.getUserTestAttempts(currentUser.id, limit);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching test history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
