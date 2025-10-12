import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { insertThreadSchema, insertPostSchema } from "@shared/schema";
import { z } from "zod";
import { cache } from "../redis";

export function discussionRoutes(app: Express): void {
  // ============================================================================
  // DISCUSSION ROUTES
  // ============================================================================

  // Get discussion threads with caching for hot threads
  app.get("/api/discussions", async (req: Request, res: Response) => {
    try {
      const filters = {
        topicId: req.query.topicId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      
      // Cache hot threads (first page, no topic filter)
      const cacheKey = `discussions:${filters.topicId || 'all'}:${filters.limit}:${filters.offset}`;
      
      // Try cache first for first page
      if (filters.offset === 0) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }
      
      // Fetch from database
      const threads = await storage.getThreads(filters);
      
      // Cache first page results (2 minutes TTL)
      if (filters.offset === 0) {
        await cache.set(cacheKey, threads, 120);
      }
      
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
      
      // Invalidate discussion cache for this topic and 'all'
      await cache.clearPattern(`discussions:${thread.topicId}:*`);
      await cache.clearPattern(`discussions:all:*`);
      
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
      
      // Get thread to know its topicId for cache invalidation
      const thread = await storage.getThread(req.params.id);
      if (thread) {
        // Invalidate discussion cache since post updates thread's updatedAt
        await cache.clearPattern(`discussions:${thread.topicId}:*`);
        await cache.clearPattern(`discussions:all:*`);
      }
      
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
