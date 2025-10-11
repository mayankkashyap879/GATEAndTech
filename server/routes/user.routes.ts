import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { updateUserProfileSchema, adminUpdateUserSchema } from "@shared/schema";
import { z } from "zod";

export function userRoutes(app: Express): void {
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
}
