import type { Express } from "express";
import { createServer, type Server } from "http";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { topicRoutes } from "./topic.routes";
import { questionRoutes } from "./question.routes";
import { testRoutes } from "./test.routes";
import { discussionRoutes } from "./discussion.routes";
import { analyticsRoutes } from "./analytics.routes";
import { paymentRoutes } from "./payment.routes";
import { roleRoutes } from "./role.routes";
import { healthRoutes } from "./health.routes";
import { gamificationRoutes } from "./gamification.routes";
import { couponRoutes } from "./coupon.routes";
import { commentRoutes } from "./comment.routes";
import { testSectionRoutes } from "./testsection.routes";
import { bulkImportRoutes } from "./bulkimport.routes";

export function registerRoutes(app: Express): Server {
  healthRoutes(app);
  
  authRoutes(app);
  userRoutes(app);
  topicRoutes(app);
  questionRoutes(app);
  testRoutes(app);
  discussionRoutes(app);
  analyticsRoutes(app);
  paymentRoutes(app);
  roleRoutes(app);
  gamificationRoutes(app);
  couponRoutes(app);
  commentRoutes(app);
  testSectionRoutes(app);
  bulkImportRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
