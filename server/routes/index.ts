import type { Express } from "express";
import { createServer, type Server } from "http";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { topicRoutes } from "./topic.routes";
import { questionRoutes } from "./question.routes";
import { testRoutes } from "./test.routes";
import { discussionRoutes } from "./discussion.routes";
import { analyticsRoutes } from "./analytics.routes";

export function registerRoutes(app: Express): Server {
  // Register all route modules
  authRoutes(app);
  userRoutes(app);
  topicRoutes(app);
  questionRoutes(app);
  testRoutes(app);
  discussionRoutes(app);
  analyticsRoutes(app);

  // Create and return HTTP server (maintained for compatibility with server/index.ts)
  const httpServer = createServer(app);
  return httpServer;
}
