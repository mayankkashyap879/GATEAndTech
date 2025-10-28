import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { can } from "../middleware/permissions";
import { insertSubjectSchema, insertTopicSchema } from "@shared/schema";

export function topicRoutes(app: Express): void {
  // ============================================================================
  // SUBJECT ROUTES
  // ============================================================================

  // Get all subjects
  app.get("/api/subjects", async (req: Request, res: Response) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single subject
  app.get("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create subject (requires create:Topic permission - admin only)
  app.post("/api/subjects", can('create', 'Topic'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error: any) {
      console.error("Error creating subject:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid subject data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update subject (requires update:Topic permission - admin only)
  app.patch("/api/subjects/:id", can('update', 'Topic'), async (req: Request, res: Response) => {
    try {
      const subject = await storage.updateSubject(req.params.id, req.body);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error updating subject:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete subject (requires delete:Topic permission - admin only)
  app.delete("/api/subjects/:id", can('delete', 'Topic'), async (req: Request, res: Response) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // TOPIC ROUTES
  // ============================================================================

  // Get all topics
  app.get("/api/topics", async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.query;
      let topics;
      
      if (subjectId && typeof subjectId === 'string') {
        topics = await storage.getTopicsBySubject(subjectId);
      } else {
        topics = await storage.getTopics();
      }
      
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single topic
  app.get("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create topic (requires create:Topic permission)
  app.post("/api/topics", can('create', 'Topic'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(validatedData);
      res.status(201).json(topic);
    } catch (error: any) {
      console.error("Error creating topic:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid topic data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update topic (requires update:Topic permission)
  app.patch("/api/topics/:id", can('update', 'Topic'), async (req: Request, res: Response) => {
    try {
      const topic = await storage.updateTopic(req.params.id, req.body);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error updating topic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete topic (requires delete:Topic permission)
  app.delete("/api/topics/:id", can('delete', 'Topic'), async (req: Request, res: Response) => {
    try {
      await storage.deleteTopic(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting topic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
