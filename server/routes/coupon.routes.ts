import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { can } from "../middleware/permissions";
import { insertCouponSchema } from "@shared/schema";
import { z } from "zod";

export function couponRoutes(app: Express): void {
  app.get("/api/coupons", requireAuth, can("read", "Coupon"), async (req: Request, res: Response) => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const coupons = await storage.getAllCoupons({ isActive });
      res.json(coupons);
    } catch (error) {
      console.error("Get coupons error:", error);
      res.status(500).json({ error: "Failed to get coupons" });
    }
  });

  app.post("/api/coupons", requireAuth, can("create", "Coupon"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(validatedData);
      res.status(201).json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create coupon error:", error);
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  app.put("/api/coupons/:id", requireAuth, can("update", "Coupon"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const coupon = await storage.updateCoupon(id, req.body);
      
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      
      res.json(coupon);
    } catch (error) {
      console.error("Update coupon error:", error);
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });

  app.delete("/api/coupons/:id", requireAuth, can("delete", "Coupon"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteCoupon(id);
      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Delete coupon error:", error);
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  app.post("/api/coupons/validate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { code, testSeriesId } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code is required" });
      }

      const result = await storage.validateCoupon(code, testSeriesId);
      res.json(result);
    } catch (error) {
      console.error("Validate coupon error:", error);
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });
}
