import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { cache } from "../redis";

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

  // Get cached test analytics (aggregate stats)
  app.get("/api/analytics/test/:testId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { testId } = req.params;
      
      // Try to get from cache first
      const cached = await cache.get(`analytics:test:${testId}`);
      
      if (cached) {
        return res.json({
          ...cached,
          source: 'cache'
        });
      }
      
      // If not in cache, calculate on demand
      const allAttempts = await storage.getTestAttemptsByTestId(testId, 'submitted');
      
      if (allAttempts.length === 0) {
        return res.json({
          totalAttempts: 0,
          avgScore: 0,
          maxScore: 0,
          minScore: 0,
          source: 'calculated'
        });
      }
      
      const scores = allAttempts.map((a: any) => a.score || 0);
      const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      const analytics = {
        totalAttempts: allAttempts.length,
        avgScore,
        maxScore,
        minScore,
        updatedAt: new Date().toISOString(),
        source: 'calculated'
      };
      
      // Cache for future requests (5 minutes)
      await cache.set(`analytics:test:${testId}`, analytics, 300);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching test analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's percentile for a test (cached)
  app.get("/api/analytics/percentile/:testId", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { testId } = req.params;
      
      // Try to get from cache first
      const cached = await cache.get(`percentile:${currentUser.id}:${testId}`);
      
      if (cached !== null) {
        return res.json({
          percentile: cached,
          source: 'cache'
        });
      }
      
      // If not in cache, get from latest attempt
      const allUserAttempts = await storage.getUserTestAttempts(currentUser.id, 100);
      const userAttempts = allUserAttempts.filter(a => 
        a.testId === testId && a.status === 'submitted'
      );
      
      if (userAttempts.length === 0) {
        return res.json({
          percentile: null,
          message: 'No submitted attempts found'
        });
      }
      
      const latestAttempt = userAttempts.sort((a: any, b: any) => 
        new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
      )[0];
      
      const percentile = latestAttempt.percentile || null;
      
      // Cache the percentile for future requests (5 minutes)
      if (percentile !== null) {
        await cache.set(`percentile:${currentUser.id}:${testId}`, percentile, 300);
      }
      
      res.json({
        percentile,
        source: 'database'
      });
    } catch (error) {
      console.error("Error fetching percentile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
