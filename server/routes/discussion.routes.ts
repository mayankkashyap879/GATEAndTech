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

  // Upvote a post (Redis-backed fast increment)
  app.post("/api/discussions/:threadId/posts/:postId/upvote", requireAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const currentUser = req.user as any;
      
      // Atomic check-and-set: only vote if not already voted (24 hour TTL)
      const voteKey = `vote:${currentUser.id}:${postId}`;
      const canVote = await cache.setnx(voteKey, true, 86400);
      
      if (!canVote) {
        return res.status(400).json({ error: "You have already voted on this post" });
      }
      
      // Check if count exists in Redis
      const cacheKey = `post:upvotes:${postId}`;
      let currentCount = await cache.get<number>(cacheKey);
      
      // Initialize from database if not cached
      if (currentCount === null) {
        const post = await storage.getPost(postId);
        currentCount = post?.upvotes || 0;
        await cache.set(cacheKey, currentCount, 300);
      }
      
      // Fast increment in Redis
      const newCount = await cache.increment(cacheKey, 1);
      
      // Refresh TTL to prevent expiration
      await cache.expire(cacheKey, 300);
      
      // Persist to database with error handling (await for reliability)
      try {
        await storage.incrementPostUpvotes(postId, 1);
      } catch (dbError) {
        console.error(`Failed to persist upvote to DB for post ${postId}:`, dbError);
        // DB failed but Redis updated - acceptable eventual consistency
      }
      
      res.json({ upvotes: newCount, success: true });
    } catch (error) {
      console.error("Error upvoting post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove upvote from a post
  app.delete("/api/discussions/:threadId/posts/:postId/upvote", requireAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const currentUser = req.user as any;
      
      // Check if user has voted
      const voteKey = `vote:${currentUser.id}:${postId}`;
      const hasVoted = await cache.get(voteKey);
      
      if (!hasVoted) {
        return res.status(400).json({ error: "You have not voted on this post" });
      }
      
      // Check if count exists in Redis
      const cacheKey = `post:upvotes:${postId}`;
      let currentCount = await cache.get<number>(cacheKey);
      
      // Initialize from database if not cached
      if (currentCount === null) {
        const post = await storage.getPost(postId);
        currentCount = post?.upvotes || 0;
        await cache.set(cacheKey, currentCount, 300);
      }
      
      // Fast decrement in Redis (ensure non-negative)
      let newCount = await cache.increment(cacheKey, -1);
      if (newCount < 0) {
        // Clamp to 0 and update Redis
        await cache.set(cacheKey, 0, 300);
        newCount = 0;
      } else {
        // Refresh TTL to prevent expiration
        await cache.expire(cacheKey, 300);
      }
      
      // Remove vote marker
      await cache.del(voteKey);
      
      // Persist to database asynchronously (fire-and-forget for speed)
      storage.incrementPostUpvotes(postId, -1).catch(err => 
        console.error(`Failed to persist downvote to DB for post ${postId}:`, err)
      );
      
      res.json({ upvotes: newCount, success: true });
    } catch (error) {
      console.error("Error removing upvote:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
