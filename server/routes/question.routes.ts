import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireRole } from "../auth";
import { insertQuestionSchema, updateQuestionSchema } from "@shared/schema";
import { z } from "zod";

export function questionRoutes(app: Express): void {
  // ============================================================================
  // QUESTION ROUTES (Admin/Moderator Only)
  // ============================================================================

  // Get questions with filters (admin/moderator only)
  app.get("/api/questions", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
    try {
      const filters = {
        topicId: req.query.topicId as string,
        difficulty: req.query.difficulty as string,
        type: req.query.type as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      const questions = await storage.getQuestions(filters);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single question (admin/moderator only)
  app.get("/api/questions/:id", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Get associated topics
      const topics = await storage.getQuestionTopics(req.params.id);
      
      res.json({ ...question, topics });
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create question (admin/moderator only)
  app.post("/api/questions", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { topicId, ...questionData } = req.body;
      
      const validatedData = insertQuestionSchema.parse({
        ...questionData,
        createdBy: currentUser.id,
      });
      
      const question = await storage.createQuestion(validatedData);
      
      // Associate with topic if provided
      if (topicId) {
        await storage.addQuestionTopic(question.id, topicId);
      }
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update question (admin/moderator only)
  app.patch("/api/questions/:id", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { topicId, ...questionData } = req.body;
      
      // Fetch existing question to check if it exists
      const existingQuestion = await storage.getQuestion(req.params.id);
      if (!existingQuestion) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Validate update data - only allow safe fields to be modified
      const validatedData = updateQuestionSchema.parse(questionData);
      
      // Update question fields
      const question = await storage.updateQuestion(req.params.id, validatedData);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Update topic association if topicId is provided
      if (topicId) {
        // Remove existing topics and add new one
        const existingTopics = await storage.getQuestionTopics(req.params.id);
        for (const topic of existingTopics) {
          await storage.removeQuestionTopic(req.params.id, topic.id);
        }
        await storage.addQuestionTopic(req.params.id, topicId);
      }
      
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete question (admin only)
  app.delete("/api/questions/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
