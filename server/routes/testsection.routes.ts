import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { can } from "../middleware/permissions";
import { insertTestSectionSchema } from "@shared/schema";
import { z } from "zod";

export function testSectionRoutes(app: Express): void {
  app.get("/api/tests/:testId/sections", async (req: Request, res: Response) => {
    try {
      const { testId } = req.params;
      const sections = await storage.getTestSections(testId);
      res.json(sections);
    } catch (error) {
      console.error("Get test sections error:", error);
      res.status(500).json({ error: "Failed to get test sections" });
    }
  });

  app.post("/api/tests/:testId/sections", requireAuth, can("create", "Test"), async (req: Request, res: Response) => {
    try {
      const { testId } = req.params;
      const validatedData = insertTestSectionSchema.parse({ ...req.body, testId });
      
      const section = await storage.createTestSection(validatedData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create test section error:", error);
      res.status(500).json({ error: "Failed to create test section" });
    }
  });

  app.put("/api/sections/:id", requireAuth, can("update", "Test"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const section = await storage.updateTestSection(id, req.body);
      
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      
      res.json(section);
    } catch (error) {
      console.error("Update test section error:", error);
      res.status(500).json({ error: "Failed to update test section" });
    }
  });

  app.delete("/api/sections/:id", requireAuth, can("delete", "Test"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteTestSection(id);
      res.json({ message: "Section deleted successfully" });
    } catch (error) {
      console.error("Delete test section error:", error);
      res.status(500).json({ error: "Failed to delete test section" });
    }
  });

  app.get("/api/sections/:id/questions", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const questions = await storage.getSectionQuestions(id);
      res.json(questions);
    } catch (error) {
      console.error("Get section questions error:", error);
      res.status(500).json({ error: "Failed to get section questions" });
    }
  });

  app.post("/api/sections/:id/questions", requireAuth, can("update", "Test"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { questionId, order } = req.body;
      
      if (!questionId || typeof order !== 'number') {
        return res.status(400).json({ error: "questionId and order are required" });
      }

      const sectionQuestion = await storage.addQuestionToSection({ sectionId: id, questionId, order });
      res.status(201).json(sectionQuestion);
    } catch (error) {
      console.error("Add question to section error:", error);
      res.status(500).json({ error: "Failed to add question to section" });
    }
  });

  app.delete("/api/sections/:sectionId/questions/:questionId", requireAuth, can("update", "Test"), async (req: Request, res: Response) => {
    try {
      const { sectionId, questionId } = req.params;
      await storage.removeQuestionFromSection(sectionId, questionId);
      res.json({ message: "Question removed from section successfully" });
    } catch (error) {
      console.error("Remove question from section error:", error);
      res.status(500).json({ error: "Failed to remove question from section" });
    }
  });
}
