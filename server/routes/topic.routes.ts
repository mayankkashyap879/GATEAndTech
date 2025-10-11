import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireRole } from "../auth";

export function topicRoutes(app: Express): void {
  // ============================================================================
  // TOPIC ROUTES
  // ============================================================================

  // Get all topics
  app.get("/api/topics", async (req: Request, res: Response) => {
    try {
      const topics = await storage.getTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create topic (admin/moderator only)
  app.post("/api/topics", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
    try {
      // Generate slug from name if not provided
      const topicData = {
        ...req.body,
        slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      };
      const topic = await storage.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
