import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { can } from "../middleware/permissions";
import { insertCommentSchema, insertFlagSchema } from "@shared/schema";
import { z } from "zod";
import { calculateSpamScore } from "../utils/spam-detection";

export function commentRoutes(app: Express): void {
  app.get("/api/comments/question/:questionId", async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const comments = await storage.getQuestionComments(questionId);
      res.json(comments);
    } catch (error) {
      console.error("Get question comments error:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.get("/api/comments/:id/replies", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const replies = await storage.getCommentReplies(id);
      res.json(replies);
    } catch (error) {
      console.error("Get comment replies error:", error);
      res.status(500).json({ error: "Failed to get replies" });
    }
  });

  app.post("/api/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const validatedData = insertCommentSchema.parse(req.body);
      
      const spamScore = calculateSpamScore(validatedData.body);
      const status = spamScore >= 50 ? 'pending' : 'active';
      
      const comment = await storage.createComment({
        ...validatedData,
        authorId: user.id,
        status,
      } as any);

      if (status === 'active') {
        await storage.incrementUserPoints(user.id, 2);
      }
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create comment error:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      
      const comment = await storage.getComment(id);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (comment.authorId !== user.id && user.role !== 'moderator' && user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to edit this comment" });
      }

      const updated = await storage.updateComment(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update comment error:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      
      const comment = await storage.getComment(id);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (comment.authorId !== user.id && user.role !== 'moderator' && user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this comment" });
      }

      await storage.deleteComment(id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.post("/api/comments/:id/vote", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      
      const existingVote = await storage.getUserCommentVote(id, user.id);
      
      if (existingVote) {
        await storage.deleteCommentVote(id, user.id);
        await storage.decrementCommentUpvotes(id);
        return res.json({ message: "Vote removed" });
      }

      await storage.createCommentVote({ commentId: id, voterId: user.id, value: 1 });
      const comment = await storage.incrementCommentUpvotes(id);
      
      if (comment) {
        await storage.incrementUserPoints(comment.authorId, 1);
      }
      
      res.json({ message: "Vote added" });
    } catch (error) {
      console.error("Vote comment error:", error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  app.post("/api/comments/:id/flag", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const validatedData = insertFlagSchema.parse({ ...req.body, commentId: id, flaggerId: user.id });
      
      const flag = await storage.createFlag(validatedData);
      await storage.updateComment(id, { status: 'flagged' });
      
      res.status(201).json(flag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Flag comment error:", error);
      res.status(500).json({ error: "Failed to flag comment" });
    }
  });

  app.get("/api/moderation/flags", requireAuth, can("moderate", "Comment"), async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const flags = await storage.getFlags({ status });
      res.json(flags);
    } catch (error) {
      console.error("Get flags error:", error);
      res.status(500).json({ error: "Failed to get flags" });
    }
  });

  app.post("/api/moderation/flags/:id", requireAuth, can("moderate", "Comment"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      
      if (!['approve', 'dismiss', 'delete'].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const flag = await storage.updateFlag(id, action === 'approve' ? 'resolved' : 'dismissed');
      
      if (flag && action === 'approve') {
        await storage.updateComment(flag.commentId, { status: 'active' });
      } else if (flag && action === 'delete') {
        await storage.deleteComment(flag.commentId);
      }
      
      res.json({ message: "Flag processed successfully" });
    } catch (error) {
      console.error("Process flag error:", error);
      res.status(500).json({ error: "Failed to process flag" });
    }
  });
}
