import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { passport, requireAuth } from "../auth";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { registerUserSchema } from "@shared/schema";
import { z } from "zod";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

// Extend session types to include pending2FA
declare module 'express-session' {
  interface SessionData {
    pending2FA?: {
      userId: string;
      timestamp: number;
    };
  }
}

export function authRoutes(app: Express): void {
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

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `GATE And Tech (${user.email})`,
        length: 32,
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

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
}
