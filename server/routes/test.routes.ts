import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { can } from "../middleware/permissions";
import { insertTestSchema } from "@shared/schema";
import { z } from "zod";
import { testSubmitLimiter } from "../middleware/rate-limit.js";
import { queueHelpers } from "../queue";

// Helper function to check if user has access to a test
async function userHasAccessToTest(userId: string, testId: string, userRole: string): Promise<boolean> {
  // Admin and moderator have access to all tests
  if (userRole === "admin" || userRole === "moderator") {
    return true;
  }

  // Check if test is in a test series
  const testSeriesTests = await storage.getTestSeriesTestsByTestId(testId);
  
  // If test is not in any test series, it's free and accessible to all
  if (testSeriesTests.length === 0) {
    return true;
  }

  // Check if user has purchased any of the test series this test belongs to
  for (const tst of testSeriesTests) {
    const purchase = await storage.getUserPurchase(userId, tst.testSeriesId);
    if (purchase && purchase.status === "active") {
      return true;
    }
  }

  return false;
}

export function testRoutes(app: Express): void {
  // ============================================================================
  // TEST ROUTES
  // ============================================================================

  // Get tests (requires read:Test permission, then applies purchase-based access control)
  app.get("/api/tests", can('read', 'Test'), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const filters = {
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      // Admin/moderator get all tests
      if (currentUser.role === "admin" || currentUser.role === "moderator") {
        const tests = await storage.getTests(filters);
        return res.json(tests);
      }
      
      // For students: get all tests and filter based on access
      const allTests = await storage.getTests(filters);
      const accessibleTests = [];
      
      for (const test of allTests) {
        const hasAccess = await userHasAccessToTest(currentUser.id, test.id, currentUser.role);
        if (hasAccess) {
          accessibleTests.push(test);
        }
      }
      
      res.json(accessibleTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single test (requires read:Test permission, then applies purchase-based access control)
  app.get("/api/tests/:id", can('read', 'Test'), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const test = await storage.getTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      // Check if user has access to this test
      const hasAccess = await userHasAccessToTest(currentUser.id, test.id, currentUser.role);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied. Purchase required." });
      }
      
      // Include test sections if they exist
      console.log('storage.getTestSections:', typeof storage.getTestSections);
      console.log('storage keys:', Object.keys(storage));
      const sections = await storage.getTestSections(test.id);
      
      res.json({ ...test, sections });
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get test questions (requires read:Test permission, then applies purchase-based access control)
  app.get("/api/tests/:id/questions", can('read', 'Test'), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const test = await storage.getTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      // Check if user has access to this test
      const hasAccess = await userHasAccessToTest(currentUser.id, test.id, currentUser.role);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied. Purchase required." });
      }

      const questions = await storage.getTestQuestions(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching test questions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create test (requires create:Test permission)
  app.post("/api/tests", can('create', 'Test'), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { questionIds, ...testData } = req.body;
      
      const validatedData = insertTestSchema.parse({
        ...testData,
        createdBy: currentUser.id,
      });
      
      const test = await storage.createTest(validatedData);
      
      // Add questions to test if provided
      if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
        await storage.addQuestionsToTest(test.id, questionIds);
      }
      
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update test (requires update:Test permission)
  app.patch("/api/tests/:id", can('update', 'Test'), async (req: Request, res: Response) => {
    try {
      const { questionIds, ...testData } = req.body;
      
      const test = await storage.updateTest(req.params.id, testData);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error updating test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete test (requires delete:Test permission)
  app.delete("/api/tests/:id", can('delete', 'Test'), async (req: Request, res: Response) => {
    try {
      await storage.deleteTest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // TEST ATTEMPT ROUTES
  // ============================================================================

  // Get user's test attempts
  app.get("/api/attempts", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const attempts = await storage.getUserTestAttempts(currentUser.id, limit);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Start new test attempt
  app.post("/api/attempts", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { testId } = req.body;
      
      // Verify test exists
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      // Check if user has access to this test
      const hasAccess = await userHasAccessToTest(currentUser.id, test.id, currentUser.role);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied. Purchase required." });
      }
      
      // Get test sections if they exist
      const sections = await storage.getTestSections(testId);
      
      // Initialize section state if test has sections
      let sectionState = null;
      if (sections.length > 0) {
        sectionState = {
          activeSectionId: sections[0].id,
          remainingSec: sections[0].durationSeconds || null,
        };
      }
      
      const attempt = await storage.createTestAttempt({
        testId,
        userId: currentUser.id,
        maxScore: test.totalMarks,
        sectionState,
      });
      
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error creating attempt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get specific attempt
  app.get("/api/attempts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const attempt = await storage.getTestAttempt(req.params.id);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      // Users can only view their own attempts unless admin
      if (attempt.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      res.json(attempt);
    } catch (error) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Submit test attempt
  app.patch("/api/attempts/:id/submit", requireAuth, testSubmitLimiter, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const attempt = await storage.getTestAttempt(req.params.id);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (attempt.userId !== currentUser.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Update attempt to processing status
      const updatedAttempt = await storage.updateTestAttempt(req.params.id, {
        status: "processing",
        submittedAt: new Date(),
        timeTaken: req.body.timeTaken,
      });
      
      // Queue scoring job for background processing
      await queueHelpers.scoreTest(attempt.id, attempt.userId, attempt.testId);
      
      // Return immediate response
      res.json({
        ...updatedAttempt,
        message: "Test submitted successfully. Your score is being calculated."
      });
    } catch (error) {
      console.error("Error submitting attempt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get attempt responses
  app.get("/api/attempts/:id/responses", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const attempt = await storage.getTestAttempt(req.params.id);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (attempt.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const responses = await storage.getTestAttemptResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Save test response (upsert) - idempotent autosave
  app.post("/api/attempts/:id/responses", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const attempt = await storage.getTestAttempt(req.params.id);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (attempt.userId !== currentUser.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      if (attempt.status !== "in_progress") {
        return res.status(400).json({ error: "Cannot modify submitted test" });
      }
      
      const { questionId, selectedAnswer, isMarkedForReview, timeSpentSeconds, isVisited } = req.body;
      
      // Use upsert for idempotency - safe for concurrent/duplicate requests
      const response = await storage.upsertTestResponse({
        attemptId: req.params.id,
        questionId,
        selectedAnswer: selectedAnswer || "",
        isMarkedForReview: isMarkedForReview || false,
        timeSpentSeconds: timeSpentSeconds || 0,
        isVisited: isVisited !== undefined ? isVisited : true,
        lastSavedAt: new Date(),
      });
      
      res.status(200).json(response);
    } catch (error) {
      console.error("Error saving response:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
