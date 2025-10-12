import {
  discussionThreads,
  discussionPosts,
  testAttempts,
  testResponses,
  questions,
  questionTopics,
  topics,
  tests,
  type DiscussionThread,
  type InsertDiscussionThread,
  type DiscussionPost,
  type InsertDiscussionPost,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export class DiscussionStorage {
  async getThread(id: string): Promise<DiscussionThread | undefined> {
    const [thread] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, id));
    return thread || undefined;
  }

  async getThreads(filters?: {
    topicId?: string;
    limit?: number;
    offset?: number;
  }): Promise<DiscussionThread[]> {
    const query = filters?.topicId
      ? db.select().from(discussionThreads).where(eq(discussionThreads.topicId, filters.topicId))
      : db.select().from(discussionThreads);

    return await query
      .orderBy(desc(discussionThreads.isPinned), desc(discussionThreads.updatedAt))
      .limit(filters?.limit || 20)
      .offset(filters?.offset || 0);
  }

  async createThread(insertThread: InsertDiscussionThread): Promise<DiscussionThread> {
    const [thread] = await db
      .insert(discussionThreads)
      .values(insertThread)
      .returning();
    return thread;
  }

  async getPost(id: string): Promise<DiscussionPost | undefined> {
    const [post] = await db
      .select()
      .from(discussionPosts)
      .where(eq(discussionPosts.id, id));
    return post || undefined;
  }

  async getThreadPosts(threadId: string): Promise<DiscussionPost[]> {
    return await db
      .select()
      .from(discussionPosts)
      .where(eq(discussionPosts.threadId, threadId))
      .orderBy(asc(discussionPosts.createdAt));
  }

  async createPost(insertPost: InsertDiscussionPost): Promise<DiscussionPost> {
    const [post] = await db
      .insert(discussionPosts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updatePost(id: string, data: Partial<InsertDiscussionPost>): Promise<DiscussionPost | undefined> {
    const [post] = await db
      .update(discussionPosts)
      .set(data)
      .where(eq(discussionPosts.id, id))
      .returning();
    return post || undefined;
  }

  async incrementPostUpvotes(id: string, amount: number): Promise<void> {
    await db
      .update(discussionPosts)
      .set({ upvotes: sql`GREATEST(COALESCE(${discussionPosts.upvotes}, 0) + ${amount}, 0)` })
      .where(eq(discussionPosts.id, id));
  }

  async getUserPerformanceStats(userId: string): Promise<{
    totalTests: number;
    averageScore: number;
    averagePercentage: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    averageTimeTaken: number;
    accuracy: number;
  }> {
    const attempts = await db
      .select()
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.userId, userId),
          eq(testAttempts.status, "submitted")
        )
      );

    if (attempts.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        averagePercentage: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        unanswered: 0,
        averageTimeTaken: 0,
        accuracy: 0,
      };
    }

    const attemptIds = attempts.map(a => a.id);
    const allResponses = await db
      .select()
      .from(testResponses)
      .where(sql`${testResponses.attemptId} = ANY(${attemptIds})`);

    const totalTests = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalMaxScore = attempts.reduce((sum, a) => sum + (a.maxScore || 0), 0);
    const totalTimeTaken = attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);

    const totalQuestions = allResponses.length;
    const correctAnswers = allResponses.filter(r => r.isCorrect === true).length;
    const incorrectAnswers = allResponses.filter(r => r.isCorrect === false).length;
    const unanswered = totalQuestions - correctAnswers - incorrectAnswers;

    return {
      totalTests,
      averageScore: totalTests > 0 ? Math.round(totalScore / totalTests) : 0,
      averagePercentage: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unanswered,
      averageTimeTaken: totalTests > 0 ? Math.round(totalTimeTaken / totalTests) : 0,
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    };
  }

  async getTopicWisePerformance(userId: string): Promise<Array<{
    topicId: string;
    topicName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }>> {
    const attempts = await db
      .select()
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.userId, userId),
          eq(testAttempts.status, "submitted")
        )
      );

    if (attempts.length === 0) {
      return [];
    }

    const attemptIds = attempts.map(a => a.id);

    const result = await db
      .select({
        topicId: topics.id,
        topicName: topics.name,
        isCorrect: testResponses.isCorrect,
      })
      .from(testResponses)
      .innerJoin(questions, eq(testResponses.questionId, questions.id))
      .innerJoin(questionTopics, eq(questions.id, questionTopics.questionId))
      .innerJoin(topics, eq(questionTopics.topicId, topics.id))
      .where(sql`${testResponses.attemptId} = ANY(${attemptIds})`);

    const topicMap = new Map<string, {
      topicId: string;
      topicName: string;
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
    }>();

    for (const row of result) {
      if (!topicMap.has(row.topicId)) {
        topicMap.set(row.topicId, {
          topicId: row.topicId,
          topicName: row.topicName,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        });
      }

      const topic = topicMap.get(row.topicId)!;
      topic.totalQuestions++;
      if (row.isCorrect === true) topic.correctAnswers++;
      if (row.isCorrect === false) topic.incorrectAnswers++;
    }

    return Array.from(topicMap.values()).map(topic => ({
      ...topic,
      accuracy: topic.totalQuestions > 0 
        ? Math.round((topic.correctAnswers / topic.totalQuestions) * 100) 
        : 0,
    }));
  }

  async getDifficultyWisePerformance(userId: string): Promise<Array<{
    difficulty: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }>> {
    const attempts = await db
      .select()
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.userId, userId),
          eq(testAttempts.status, "submitted")
        )
      );

    if (attempts.length === 0) {
      return [];
    }

    const attemptIds = attempts.map(a => a.id);

    const result = await db
      .select({
        difficulty: questions.difficulty,
        isCorrect: testResponses.isCorrect,
      })
      .from(testResponses)
      .innerJoin(questions, eq(testResponses.questionId, questions.id))
      .where(sql`${testResponses.attemptId} = ANY(${attemptIds})`);

    const difficultyMap = new Map<string, {
      difficulty: string;
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
    }>();

    for (const row of result) {
      if (!difficultyMap.has(row.difficulty)) {
        difficultyMap.set(row.difficulty, {
          difficulty: row.difficulty,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        });
      }

      const diff = difficultyMap.get(row.difficulty)!;
      diff.totalQuestions++;
      if (row.isCorrect === true) diff.correctAnswers++;
      if (row.isCorrect === false) diff.incorrectAnswers++;
    }

    return Array.from(difficultyMap.values()).map(diff => ({
      ...diff,
      accuracy: diff.totalQuestions > 0 
        ? Math.round((diff.correctAnswers / diff.totalQuestions) * 100) 
        : 0,
    }));
  }

  async getPerformanceTrend(userId: string, limit: number = 10): Promise<Array<{
    attemptId: string;
    testTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    submittedAt: Date;
  }>> {
    const result = await db
      .select({
        attemptId: testAttempts.id,
        testTitle: tests.title,
        score: testAttempts.score,
        maxScore: testAttempts.maxScore,
        submittedAt: testAttempts.submittedAt,
      })
      .from(testAttempts)
      .innerJoin(tests, eq(testAttempts.testId, tests.id))
      .where(
        and(
          eq(testAttempts.userId, userId),
          eq(testAttempts.status, "submitted")
        )
      )
      .orderBy(desc(testAttempts.submittedAt))
      .limit(limit);

    return result.map(r => ({
      attemptId: r.attemptId,
      testTitle: r.testTitle,
      score: r.score || 0,
      maxScore: r.maxScore || 0,
      percentage: r.maxScore ? Math.round(((r.score || 0) / r.maxScore) * 100) : 0,
      submittedAt: r.submittedAt || new Date(),
    }));
  }
}
