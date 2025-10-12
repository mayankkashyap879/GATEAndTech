import type { Express, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { verifyPaymentSchema } from "@shared/schema";
import { z } from "zod";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export function paymentRoutes(app: Express) {
  
  // ============================================================================
  // GET RAZORPAY KEY - For frontend checkout
  // ============================================================================
  
  app.get("/api/payments/key", async (req: Request, res: Response) => {
    try {
      res.json({ key: process.env.RAZORPAY_KEY_ID || "" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================================================
  // GET TEST SERIES - Shop page
  // ============================================================================
  
  app.get("/api/test-series", async (req: Request, res: Response) => {
    try {
      const testSeriesList = await storage.getAllTestSeries({ isActive: true });
      res.json(testSeriesList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GET SINGLE TEST SERIES - With tests
  // ============================================================================
  
  app.get("/api/test-series/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const testSeriesData = await storage.getTestSeries(id);
      if (!testSeriesData) {
        return res.status(404).json({ error: "Test series not found" });
      }

      const tests = await storage.getTestSeriesTests(id);

      res.json({
        ...testSeriesData,
        tests,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // CREATE RAZORPAY ORDER - Purchase test series
  // ============================================================================
  
  app.post("/api/payments/create-order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { testSeriesId } = req.body;
      
      if (!testSeriesId) {
        return res.status(400).json({ error: "Test series ID is required" });
      }

      const testSeriesData = await storage.getTestSeries(testSeriesId);
      if (!testSeriesData) {
        return res.status(404).json({ error: "Test series not found" });
      }

      if (!testSeriesData.isActive) {
        return res.status(400).json({ error: "This test series is not available" });
      }

      if (testSeriesData.price === 0) {
        return res.status(400).json({ error: "Cannot create order for free test series" });
      }

      const user = req.user as any;

      // Check if already purchased
      const existingPurchase = await storage.getUserPurchase(user.id, testSeriesId);
      if (existingPurchase && existingPurchase.status === "active") {
        const now = new Date();
        if (existingPurchase.expiryDate > now) {
          return res.status(400).json({ error: "You already have an active purchase for this test series" });
        }
      }

      // Create Razorpay order
      const orderOptions = {
        amount: testSeriesData.price, // amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: user.id,
          testSeriesId: testSeriesData.id,
          validityDays: testSeriesData.validityDays.toString(),
        },
      };

      const order = await razorpay.orders.create(orderOptions);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        testSeriesId: testSeriesData.id,
        amount: testSeriesData.price,
        currency: "INR",
        razorpayOrderId: order.id,
        status: "pending",
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: transaction.id,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // VERIFY PAYMENT - Confirms payment and grants access
  // ============================================================================
  
  app.post("/api/payments/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = verifyPaymentSchema.parse(req.body);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validatedData;

      // Verify signature
      const text = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(text)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      const user = req.user as any;

      // Get transaction
      const transaction = await storage.getTransactionByOrderId(razorpay_order_id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update transaction status
      await storage.updateTransaction(transaction.id, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "success",
      });

      // Get the Razorpay order to extract test series details from notes
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const testSeriesIdRaw = order.notes?.testSeriesId;
      const validityDays = parseInt(order.notes?.validityDays || "90");

      if (!testSeriesIdRaw) {
        return res.status(400).json({ error: "Test series information not found" });
      }

      const testSeriesId = String(testSeriesIdRaw);
      const testSeriesData = await storage.getTestSeries(testSeriesId);
      if (!testSeriesData) {
        return res.status(404).json({ error: "Test series not found" });
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + validityDays);

      // Check if user already has a purchase (could be expired)
      const existingPurchase = await storage.getUserPurchase(user.id, testSeriesId);
      
      if (existingPurchase) {
        // Update existing purchase
        await storage.updateUserPurchase(existingPurchase.id, {
          status: "active",
          expiryDate,
          transactionId: transaction.id,
        });
      } else {
        // Create new purchase
        await storage.createUserPurchase({
          userId: user.id,
          testSeriesId: testSeriesId,
          status: "active",
          expiryDate,
          transactionId: transaction.id,
        });
      }

      res.json({
        success: true,
        expiryDate,
        message: "Payment verified and access granted",
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // RAZORPAY WEBHOOK - Handles payment events
  // ============================================================================
  
  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
      const signature = req.headers["x-razorpay-signature"] as string;

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = req.body.event;
      const payload = req.body.payload;

      switch (event) {
        case "payment.captured":
          console.log("Payment captured:", payload.payment.entity.id);
          break;

        case "payment.failed":
          const orderId = payload.payment.entity.order_id;
          const transaction = await storage.getTransactionByOrderId(orderId);
          
          if (transaction) {
            await storage.updateTransaction(transaction.id, {
              status: "failed",
            });
          }
          console.log("Payment failed:", payload.payment.entity.id);
          break;

        default:
          console.log("Unhandled webhook event:", event);
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GET USER PURCHASES - All purchases with status
  // ============================================================================
  
  app.get("/api/payments/purchases", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      const purchases = await storage.getUserPurchases(user.id);
      
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // GET TRANSACTION HISTORY - User's payment history
  // ============================================================================
  
  app.get("/api/payments/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const transactions = await storage.getUserTransactions(user.id, limit);
      
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // CHECK ACCESS - Check if user has access to test series
  // ============================================================================
  
  app.get("/api/payments/check-access/:testSeriesId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { testSeriesId } = req.params;
      
      const hasAccess = await storage.checkUserHasAccess(user.id, testSeriesId);
      
      res.json({ hasAccess });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
