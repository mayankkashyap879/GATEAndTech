import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { can } from "../middleware/permissions";
import { insertBadgeSchema, insertUserPointsSchema } from "@shared/schema";
import { z } from "zod";

export function gamificationRoutes(app: Express): void {
  app.get("/api/gamification/points", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      let points = await storage.getUserPoints(user.id);
      
      if (!points) {
        points = await storage.createUserPoints({ userId: user.id, points: 0, streak: 0 });
      }
      
      res.json(points);
    } catch (error) {
      console.error("Get user points error:", error);
      res.status(500).json({ error: "Failed to get user points" });
    }
  });

  app.get("/api/gamification/leaderboard", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.get("/api/gamification/badges", async (req: Request, res: Response) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.post("/api/gamification/badges", requireAuth, can("create", "Badge"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(validatedData);
      res.status(201).json(badge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create badge error:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  app.get("/api/gamification/user-badges", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const badges = await storage.getUserBadges(user.id);
      res.json(badges);
    } catch (error) {
      console.error("Get user badges error:", error);
      res.status(500).json({ error: "Failed to get user badges" });
    }
  });

  app.post("/api/gamification/award-badge", requireAuth, can("manage", "Badge"), async (req: Request, res: Response) => {
    try {
      const { userId, badgeId } = req.body;
      
      if (!userId || !badgeId) {
        return res.status(400).json({ error: "userId and badgeId are required" });
      }

      const hasAlready = await storage.hasUserBadge(userId, badgeId);
      if (hasAlready) {
        return res.status(400).json({ error: "User already has this badge" });
      }

      const userBadge = await storage.awardBadge({ userId, badgeId });
      res.status(201).json(userBadge);
    } catch (error) {
      console.error("Award badge error:", error);
      res.status(500).json({ error: "Failed to award badge" });
    }
  });

  app.post("/api/gamification/update-streak", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { streak } = req.body;
      
      if (typeof streak !== 'number') {
        return res.status(400).json({ error: "streak must be a number" });
      }

      const points = await storage.updateStreak(user.id, streak);
      res.json(points);
    } catch (error) {
      console.error("Update streak error:", error);
      res.status(500).json({ error: "Failed to update streak" });
    }
  });
}
