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
  updateQuestionSchema,
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

      // Check if user has 2FA enabled
      if (user.twofaEnabled) {
        // Store pending 2FA authentication in session (password already verified)
        req.session.pending2FA = {
          userId: user.id,
          timestamp: Date.now(),
        };
        
        // Return 2FA required response (don't log in yet)
        return res.json({ 
          requires2FA: true, 
          email: user.email 
        });
      }

      // No 2FA, proceed with login
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

  // OAuth Routes - Google
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      failureRedirect: "/login",
      successRedirect: "/dashboard"
    })
  );

  // OAuth Routes - GitHub  
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
  
  app.get("/api/auth/github/callback",
    passport.authenticate("github", { 
      failureRedirect: "/login",
      successRedirect: "/dashboard"
    })
  );

  // ============================================================================
  // 2FA ROUTES
  // ============================================================================

  // Setup 2FA - Generate secret and QR code
  app.post("/api/auth/2fa/setup", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const speakeasy = require("speakeasy");
      const qrcode = require("qrcode");

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `GATE And Tech (${user.email})`,
        length: 32,
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  });

  // Verify and enable 2FA
  app.post("/api/auth/2fa/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { token, secret } = req.body;
      const speakeasy = require("speakeasy");

      if (!token || !secret) {
        return res.status(400).json({ error: "Token and secret are required" });
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 2, // Allow 2 time steps before/after
      });

      if (!verified) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Enable 2FA for user
      await storage.updateUser(user.id, {
        twofaEnabled: true,
        twofaSecret: secret,
      });

      res.json({ message: "2FA enabled successfully" });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  });

  // Disable 2FA
  app.post("/api/auth/2fa/disable", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required to disable 2FA" });
      }

      // Verify password for security
      const currentUser = await storage.getUser(user.id);
      if (!currentUser || !currentUser.passwordHash) {
        return res.status(400).json({ error: "Cannot disable 2FA" });
      }

      const validPassword = await bcrypt.compare(password, currentUser.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Disable 2FA
      await storage.updateUser(user.id, {
        twofaEnabled: false,
        twofaSecret: null,
      });

      res.json({ message: "2FA disabled successfully" });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  // Verify 2FA token during login
  app.post("/api/auth/2fa/login", async (req: Request, res: Response) => {
    try {
      const { email, token } = req.body;
      const speakeasy = require("speakeasy");

      if (!email || !token) {
        return res.status(400).json({ error: "Email and token are required" });
      }

      // Check for pending 2FA session (password already verified)
      const pending2FA = req.session.pending2FA;
      if (!pending2FA) {
        return res.status(401).json({ error: "No pending 2FA authentication. Please login with password first." });
      }

      // Check if pending session is expired (5 minutes)
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (Date.now() - pending2FA.timestamp > FIVE_MINUTES) {
        delete req.session.pending2FA;
        return res.status(401).json({ error: "2FA session expired. Please login again." });
      }

      // Get user by pending session userId (not email, for security)
      const user = await storage.getUser(pending2FA.userId);
      if (!user || !user.twofaEnabled || !user.twofaSecret) {
        delete req.session.pending2FA;
        return res.status(400).json({ error: "2FA not enabled for this account" });
      }

      // Verify email matches (additional security check)
      if (user.email !== email) {
        delete req.session.pending2FA;
        return res.status(401).json({ error: "Invalid 2FA request" });
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.twofaSecret,
        encoding: "base32",
        token: token,
        window: 2,
      });

      if (!verified) {
        return res.status(400).json({ error: "Invalid 2FA code" });
      }

      // Clear pending 2FA session
      delete req.session.pending2FA;

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("2FA login error:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  });

  // ============================================================================
  // PASSWORD RESET ROUTES
  // ============================================================================

  // Request password reset - generate token
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success even if user doesn't exist (security best practice)
      if (!user) {
        return res.json({ 
          message: "If an account exists with that email, a password reset link has been sent." 
        });
      }

      // Generate reset token (cryptographically secure random string)
      const crypto = require("crypto");
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Delete any existing reset tokens for this user
      await storage.deleteUserPasswordResetTokens(user.id);

      // Create new reset token
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // TODO: Send email with reset link
      // For development only - log the token (NEVER expose in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('==================== PASSWORD RESET TOKEN (DEV ONLY) ====================');
        console.log(`Email: ${email}`);
        console.log(`Token: ${resetToken}`);
        console.log(`Reset link: http://localhost:5000/reset-password?token=${resetToken}`);
        console.log('========================================================================');
      }

      res.json({ 
        message: "If an account exists with that email, a password reset link has been sent."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Get reset token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        await storage.deletePasswordResetToken(token);
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user's password
      await storage.updateUser(resetToken.userId, { passwordHash });

      // Delete the used reset token
      await storage.deletePasswordResetToken(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
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

  // Update test (moderator/admin only)
  app.patch("/api/tests/:id", requireRole("admin", "moderator"), async (req: Request, res: Response) => {
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

  // Delete test (admin only)
  app.delete("/api/tests/:id", requireRole("admin"), async (req: Request, res: Response) => {
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
      
      // Get test and questions
      const test = await storage.getTest(attempt.testId);
      const questions = await storage.getTestQuestions(attempt.testId);
      const responses = await storage.getTestAttemptResponses(req.params.id);
      
      // Calculate score
      let totalScore = 0;
      for (const response of responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) continue;
        
        let isCorrect = false;
        let marksAwarded = 0;
        
        // Skip scoring if answer is empty/cleared (unanswered)
        if (!response.selectedAnswer || response.selectedAnswer.trim() === "") {
          // Update response as unanswered
          await storage.updateTestResponse(response.id, {
            isCorrect: false,
            marksAwarded: 0,
          });
          continue;
        }
        
        if (question.type === "numerical") {
          isCorrect = response.selectedAnswer === question.correctAnswer;
          marksAwarded = isCorrect ? question.marks : -question.negativeMarks;
        } else if (question.type === "mcq_single") {
          const correctOption = (question.options as any)?.find((opt: any) => opt.isCorrect);
          isCorrect = response.selectedAnswer === correctOption?.id;
          marksAwarded = isCorrect ? question.marks : -question.negativeMarks;
        } else if (question.type === "mcq_multiple") {
          const correctOptions = (question.options as any)?.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id).sort().join(",");
          const selectedOptions = response.selectedAnswer?.split(",").filter(Boolean).sort().join(",");
          isCorrect = selectedOptions === correctOptions;
          marksAwarded = isCorrect ? question.marks : -question.negativeMarks;
        }
        
        // Update response with correctness and marks
        await storage.updateTestResponse(response.id, {
          isCorrect,
          marksAwarded,
        });
        
        totalScore += marksAwarded;
      }
      
      const updatedAttempt = await storage.updateTestAttempt(req.params.id, {
        status: "submitted",
        submittedAt: new Date(),
        score: totalScore,
        maxScore: test?.totalMarks || 0,
        timeTaken: req.body.timeTaken,
      });
      
      res.json(updatedAttempt);
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

  // Save test response (upsert)
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
      
      const { questionId, selectedAnswer, isMarkedForReview, timeTaken } = req.body;
      
      // Check if response already exists
      const existingResponse = await storage.getTestResponse(req.params.id, questionId);
      
      let response;
      if (existingResponse) {
        // Update existing response
        response = await storage.updateTestResponse(existingResponse.id, {
          selectedAnswer,
          isMarkedForReview,
          timeTaken,
        });
      } else {
        // Create new response
        response = await storage.createTestResponse({
          attemptId: req.params.id,
          questionId,
          selectedAnswer,
          isMarkedForReview,
          timeTaken,
        });
      }
      
      res.status(200).json(response);
    } catch (error) {
      console.error("Error saving response:", error);
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

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  // Get user performance stats
  app.get("/api/analytics/performance", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const stats = await storage.getUserPerformanceStats(currentUser.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching performance stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get topic-wise performance
  app.get("/api/analytics/topics", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const topicPerformance = await storage.getTopicWisePerformance(currentUser.id);
      res.json(topicPerformance);
    } catch (error) {
      console.error("Error fetching topic performance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get difficulty-wise performance
  app.get("/api/analytics/difficulty", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const difficultyPerformance = await storage.getDifficultyWisePerformance(currentUser.id);
      res.json(difficultyPerformance);
    } catch (error) {
      console.error("Error fetching difficulty performance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get performance trend
  app.get("/api/analytics/trend", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const trend = await storage.getPerformanceTrend(currentUser.id, limit);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching performance trend:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get test history (already exists via getUserTestAttempts but exposed as analytics endpoint)
  app.get("/api/analytics/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const attempts = await storage.getUserTestAttempts(currentUser.id, limit);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching test history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
