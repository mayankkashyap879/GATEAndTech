import type { Express, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { storage } from "../storage";
import { verifyPaymentSchema } from "@shared/schema";
import { z } from "zod";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function paymentRoutes(app: Express) {
  
  // ============================================================================
  // GET PLANS - Public endpoint to view pricing
  // ============================================================================
  
  app.get("/api/plans", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getActivePlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // CREATE RAZORPAY ORDER - Initiates payment flow
  // ============================================================================
  
  app.post("/api/payments/create-order", requireAuth, async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      if (!plan.isActive) {
        return res.status(400).json({ error: "This plan is not available" });
      }

      if (plan.price === 0) {
        return res.status(400).json({ error: "Cannot create order for free plan" });
      }

      const user = req.user as any;

      // Create Razorpay order
      const orderOptions = {
        amount: plan.price, // amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: user.id,
          planId: plan.id,
          planType: plan.type,
        },
      };

      const order = await razorpay.orders.create(orderOptions);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        amount: plan.price,
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
  // VERIFY PAYMENT - Confirms payment success
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

      // Get the Razorpay order to extract plan details from notes
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const planId = order.notes?.planId;

      if (!planId) {
        return res.status(400).json({ error: "Plan information not found" });
      }

      const plan = await storage.getPlan(String(planId));
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Check if user has active subscription and expire it
      const activeSubscription = await storage.getUserActiveSubscription(user.id);
      if (activeSubscription) {
        await storage.updateSubscription(activeSubscription.id, {
          status: "expired",
        });
      }

      // Create new subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const subscription = await storage.createSubscription({
        userId: user.id,
        planId: plan.id,
        planType: plan.type,
        status: "active",
        startDate,
        endDate,
        autoRenew: false,
      });

      // Update transaction with subscription ID
      await storage.updateTransaction(transaction.id, {
        subscriptionId: subscription.id,
      });

      // Update user's current plan
      await storage.updateUser(user.id, {
        currentPlan: plan.type,
        subscriptionExpiresAt: endDate,
      });

      res.json({
        success: true,
        subscription,
        message: "Payment verified and subscription activated",
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
  // GET USER SUBSCRIPTION - Current subscription status
  // ============================================================================
  
  app.get("/api/payments/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      const subscription = await storage.getUserActiveSubscription(user.id);
      
      if (!subscription) {
        return res.json({
          hasSubscription: false,
          currentPlan: "free",
        });
      }

      res.json({
        hasSubscription: true,
        subscription,
      });
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
  // CANCEL SUBSCRIPTION - User cancels auto-renewal
  // ============================================================================
  
  app.post("/api/payments/subscription/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      const subscription = await storage.getUserActiveSubscription(user.id);
      
      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      await storage.updateSubscription(subscription.id, {
        autoRenew: false,
      });

      res.json({
        success: true,
        message: "Auto-renewal cancelled. Subscription will expire on schedule.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
