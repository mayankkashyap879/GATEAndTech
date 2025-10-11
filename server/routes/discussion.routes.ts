import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { insertThreadSchema, insertPostSchema } from "@shared/schema";
import { z } from "zod";

export function discussionRoutes(app: Express): void {
  // ============================================================================
  // DISCUSSION ROUTES
  // ============================================================================

  // Get discussion threads
  app.get("/api/discussions", async (req: Request, res: Response) => {
    try {
      const filters = {
        topicId: req.query.topicId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      const threads = await storage.getThreads(filters);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create discussion thread
  app.post("/api/discussions", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const validatedData = insertThreadSchema.parse({
        ...req.body,
        authorId: currentUser.id,
      });
      
      const thread = await storage.createThread(validatedData);
      res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating thread:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get thread posts
  app.get("/api/discussions/:id/posts", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getThreadPosts(req.params.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create post in thread
  app.post("/api/discussions/:id/posts", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const validatedData = insertPostSchema.parse({
        ...req.body,
        threadId: req.params.id,
        authorId: currentUser.id,
      });
      
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
