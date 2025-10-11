import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { passport, requireAuth, requireRole } from "./auth";
import bcrypt from "bcrypt";
import { 
  registerUserSchema, 
  updateUserProfileSchema,
  adminUpdateUserSchema,
  insertQuestionSchema, 
  insertTestSchema, 
  insertThreadSchema, 
  insertPostSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Only allow name, email, and password from user input
      const validatedData = registerUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, 10);

      // Create user with server-controlled defaults
      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        authProvider: "credentials", // Server-controlled
        role: "student", // Server-controlled - always student on registration
        currentPlan: "free", // Server-controlled - always free on registration
        theme: "system", // Server-controlled default
      });

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      // Log in the user automatically
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in after registration" });
        }
        res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = req.user as any;
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // ============================================================================
  // USER ROUTES
  // ============================================================================

  // Get user profile
  app.get("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      
      // Users can only update their own profile unless they're admin
      if (currentUser.id !== req.params.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Validate input based on user role
      let validatedData: any;
      if (currentUser.role === "admin") {
        // Admins can update additional fields
        validatedData = adminUpdateUserSchema.parse(req.body);
      } else {
        // Regular users can only update safe fields
        validatedData = updateUserProfileSchema.parse(req.body);
      }

      const updatedUser = await storage.updateUser(req.params.id, validatedData as any);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
      const topic = await storage.createTopic(req.body);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // QUESTION ROUTES
  // ============================================================================

  // Get questions with filters
  app.get("/api/questions", requireAuth, async (req: Request, res: Response) => {
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

  // Get single question
  app.get("/api/questions/:id", requireAuth, async (req: Request, res: Response) => {
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

  // Create question (moderator/admin only)
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

  // Update question (moderator/admin only)
  app.patch("/api/questions/:id", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
    try {
      const { topicId, ...questionData } = req.body;
      
      const question = await storage.updateQuestion(req.params.id, questionData);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Update topic association if provided
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

  // ============================================================================
  // TEST ROUTES
  // ============================================================================

  // Get tests
  app.get("/api/tests", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const filters = {
        status: req.query.status as string,
        isPro: req.query.isPro === "true" ? true : req.query.isPro === "false" ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      // Filter out pro tests for free users
      if (currentUser.currentPlan === "free" && filters.isPro !== false) {
        filters.isPro = false;
      }
      
      const tests = await storage.getTests(filters);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single test
  app.get("/api/tests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const test = await storage.getTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      // Check if user has access to pro test
      const currentUser = req.user as any;
      if (test.isPro && currentUser.currentPlan === "free") {
        return res.status(403).json({ error: "Pro subscription required" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get test questions
  app.get("/api/tests/:id/questions", requireAuth, async (req: Request, res: Response) => {
    try {
      const test = await storage.getTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      const questions = await storage.getTestQuestions(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching test questions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create test (moderator/admin only)
  app.post("/api/tests", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
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
      
      // Verify test exists and user has access
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      if (test.isPro && currentUser.currentPlan === "free") {
        return res.status(403).json({ error: "Pro subscription required" });
      }
      
      const attempt = await storage.createTestAttempt({
        testId,
        userId: currentUser.id,
        maxScore: test.totalMarks,
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
  app.patch("/api/attempts/:id/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const attempt = await storage.getTestAttempt(req.params.id);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (attempt.userId !== currentUser.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedAttempt = await storage.updateTestAttempt(req.params.id, {
        status: "submitted",
        submittedAt: new Date(),
        ...req.body,
      });
      
      res.json(updatedAttempt);
    } catch (error) {
      console.error("Error submitting attempt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
