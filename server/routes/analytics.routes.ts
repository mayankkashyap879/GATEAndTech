import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { cache } from "../redis";

export function analyticsRoutes(app: Express): void {
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

  // Get cached test analytics (aggregate stats)
  app.get("/api/analytics/test/:testId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { testId } = req.params;
      
      // Try to get from cache first
      const cached = await cache.get(`analytics:test:${testId}`);
      
      if (cached) {
        return res.json({
          ...cached,
          source: 'cache'
        });
      }
      
      // If not in cache, calculate on demand
      const allAttempts = await storage.getTestAttemptsByTestId(testId, 'submitted');
      
      if (allAttempts.length === 0) {
        return res.json({
          totalAttempts: 0,
          avgScore: 0,
          maxScore: 0,
          minScore: 0,
          source: 'calculated'
        });
      }
      
      const scores = allAttempts.map((a: any) => a.score || 0);
      const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      const analytics = {
        totalAttempts: allAttempts.length,
        avgScore,
        maxScore,
        minScore,
        updatedAt: new Date().toISOString(),
        source: 'calculated'
      };
      
      // Cache for future requests (5 minutes)
      await cache.set(`analytics:test:${testId}`, analytics, 300);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching test analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's percentile for a test (cached)
  app.get("/api/analytics/percentile/:testId", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { testId } = req.params;
      
      // Try to get from cache first
      const cached = await cache.get(`percentile:${currentUser.id}:${testId}`);
      
      if (cached !== null) {
        return res.json({
          percentile: cached,
          source: 'cache'
        });
      }
      
      // If not in cache, get from latest attempt
      const allUserAttempts = await storage.getUserTestAttempts(currentUser.id, 100);
      const userAttempts = allUserAttempts.filter(a => 
        a.testId === testId && a.status === 'submitted'
      );
      
      if (userAttempts.length === 0) {
        return res.json({
          percentile: null,
          message: 'No submitted attempts found'
        });
      }
      
      const latestAttempt = userAttempts.sort((a: any, b: any) => 
        new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
      )[0];
      
      const percentile = latestAttempt.percentile || null;
      
      // Cache the percentile for future requests (5 minutes)
      if (percentile !== null) {
        await cache.set(`percentile:${currentUser.id}:${testId}`, percentile, 300);
      }
      
      res.json({
        percentile,
        source: 'database'
      });
    } catch (error) {
      console.error("Error fetching percentile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get detailed analytics for a specific attempt
   * Includes per-question analysis, time distribution, and performance breakdown
   */
  app.get("/api/analytics/attempts/:attemptId/detailed", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const { attemptId } = req.params;

      const attempt = await storage.getTestAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }

      // Users can only view their own attempts unless admin
      if (attempt.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const test = await storage.getTest(attempt.testId);
      const questions = await storage.getTestQuestions(attempt.testId);
      const responses = await storage.getTestAttemptResponses(attemptId);

      // Build per-question analysis
      const questionAnalysis = questions.map(question => {
        const response = responses.find(r => r.questionId === question.id);
        
        return {
          questionId: question.id,
          questionNumber: questions.indexOf(question) + 1,
          topic: question.topicId || "Uncategorized",
          difficulty: question.difficulty || "medium",
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          type: question.type,
          timeSpent: response?.timeSpentSeconds || 0,
          isCorrect: response?.isCorrect || false,
          isAttempted: !!(response?.selectedAnswer && response.selectedAnswer.trim() !== ""),
          isMarked: response?.isMarkedForReview || false,
          isVisited: response?.isVisited || false,
          marksAwarded: response?.marksAwarded || 0,
        };
      });

      // Calculate statistics
      const stats = {
        correct: questionAnalysis.filter(q => q.isCorrect).length,
        incorrect: questionAnalysis.filter(q => q.isAttempted && !q.isCorrect).length,
        unattempted: questionAnalysis.filter(q => !q.isAttempted).length,
        marked: questionAnalysis.filter(q => q.isMarked).length,
        visited: questionAnalysis.filter(q => q.isVisited).length,
        totalTimeSpent: questionAnalysis.reduce((sum, q) => sum + q.timeSpent, 0),
        averageTimePerQuestion: Math.round(
          questionAnalysis.reduce((sum, q) => sum + q.timeSpent, 0) / questions.length
        ),
      };

      // Topic-wise breakdown
      const topicBreakdown: Record<string, {
        topic: string;
        correct: number;
        incorrect: number;
        unattempted: number;
        accuracy: number;
      }> = {};

      questionAnalysis.forEach(q => {
        if (!topicBreakdown[q.topic]) {
          topicBreakdown[q.topic] = {
            topic: q.topic,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
            accuracy: 0,
          };
        }

        const topic = topicBreakdown[q.topic];
        if (q.isCorrect) topic.correct++;
        else if (q.isAttempted) topic.incorrect++;
        else topic.unattempted++;
      });

      // Calculate accuracy for each topic
      Object.values(topicBreakdown).forEach(topic => {
        const attempted = topic.correct + topic.incorrect;
        topic.accuracy = attempted > 0 
          ? Math.round((topic.correct / attempted) * 100) 
          : 0;
      });

      res.json({
        attempt: {
          id: attempt.id,
          testId: attempt.testId,
          testTitle: test?.title || "Unknown Test",
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentile: attempt.percentile,
          timeTaken: attempt.timeTaken,
          submittedAt: attempt.submittedAt,
        },
        stats,
        questionAnalysis,
        topicBreakdown: Object.values(topicBreakdown),
        summary: attempt.summary,
      });
    } catch (error) {
      console.error("Error fetching detailed analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get weak areas for a user
   * Identifies topics with low accuracy or high time consumption
   */
  app.get("/api/analytics/weak-areas", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as any;
      const userId = currentUser.id;

      const attempts = await storage.getUserTestAttempts(userId, 1000);
      const submittedAttempts = attempts.filter(a => a.status === "submitted");

      if (submittedAttempts.length === 0) {
        return res.json({ weakAreas: [], recommendations: [] });
      }

      // Build topic analysis
      const topicAnalysis: Record<string, {
        topicId: string;
        topicName: string;
        correctAnswers: number;
        incorrectAnswers: number;
        totalTimeSpent: number;
        totalQuestions: number;
        accuracy: number;
        avgTimePerQuestion: number;
      }> = {};

      for (const attempt of submittedAttempts) {
        const responses = await storage.getTestAttemptResponses(attempt.id);
        const questions = await storage.getTestQuestions(attempt.testId);

        for (const response of responses) {
          const question = questions.find(q => q.id === response.questionId);
          if (!question) continue;

          const topicId = question.topicId || "uncategorized";
          
          if (!topicAnalysis[topicId]) {
            topicAnalysis[topicId] = {
              topicId,
              topicName: topicId,
              correctAnswers: 0,
              incorrectAnswers: 0,
              totalTimeSpent: 0,
              totalQuestions: 0,
              accuracy: 0,
              avgTimePerQuestion: 0,
            };
          }

          const topic = topicAnalysis[topicId];
          topic.totalQuestions++;
          topic.totalTimeSpent += response.timeSpentSeconds || 0;

          if (response.isCorrect === true) {
            topic.correctAnswers++;
          } else if (response.isCorrect === false) {
            topic.incorrectAnswers++;
          }
        }
      }

      // Calculate metrics and identify weak areas
      const weakAreas = Object.values(topicAnalysis)
        .map(topic => {
          const attemptedQuestions = topic.correctAnswers + topic.incorrectAnswers;
          topic.accuracy = attemptedQuestions > 0
            ? (topic.correctAnswers / attemptedQuestions) * 100
            : 0;
          topic.avgTimePerQuestion = topic.totalQuestions > 0
            ? topic.totalTimeSpent / topic.totalQuestions
            : 0;
          return topic;
        })
        .filter(topic => {
          return topic.accuracy < 60 || topic.avgTimePerQuestion > 180;
        })
        .sort((a, b) => a.accuracy - b.accuracy);

      // Generate recommendations
      const recommendations = weakAreas.map(area => {
        const reasons = [];
        if (area.accuracy < 60) {
          reasons.push(`Low accuracy (${Math.round(area.accuracy)}%)`);
        }
        if (area.avgTimePerQuestion > 180) {
          reasons.push(`High avg time (${Math.round(area.avgTimePerQuestion)}s)`);
        }

        return {
          topic: area.topicName,
          reason: reasons.join(", "),
          accuracy: Math.round(area.accuracy),
          avgTime: Math.round(area.avgTimePerQuestion),
          suggestion: area.accuracy < 50 
            ? "Review fundamental concepts and practice more questions"
            : "Focus on time management techniques",
        };
      });

      res.json({ weakAreas, recommendations });
    } catch (error) {
      console.error("Error fetching weak areas:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
