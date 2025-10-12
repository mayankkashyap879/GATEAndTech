import {
  tests,
  testQuestions,
  testAttempts,
  testResponses,
  questions,
  type Test,
  type InsertTest,
  type TestAttempt,
  type InsertTestAttempt,
  type TestResponse,
  type InsertTestResponse,
  type Question,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, asc } from "drizzle-orm";

export class TestStorage {
  async getTest(id: string): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test || undefined;
  }

  async getTests(filters?: {
    status?: string;
    isPro?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Test[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(tests.status, filters.status as any));
    }
    if (filters?.isPro !== undefined) {
      conditions.push(eq(tests.isPro, filters.isPro));
    }

    const query = conditions.length > 0
      ? db.select().from(tests).where(and(...conditions))
      : db.select().from(tests);

    return await query
      .orderBy(desc(tests.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const [test] = await db
      .insert(tests)
      .values(insertTest)
      .returning();
    return test;
  }

  async updateTest(id: string, data: Partial<InsertTest>): Promise<Test | undefined> {
    const [test] = await db
      .update(tests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tests.id, id))
      .returning();
    return test || undefined;
  }

  async deleteTest(id: string): Promise<void> {
    await db.delete(tests).where(eq(tests.id, id));
  }

  async addQuestionsToTest(testId: string, questionIds: string[]): Promise<void> {
    const values = questionIds.map((questionId, index) => ({
      testId,
      questionId,
      order: index + 1,
    }));
    
    await db.insert(testQuestions).values(values);
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    const result = await db
      .select({
        question: questions,
        order: testQuestions.order,
      })
      .from(testQuestions)
      .innerJoin(questions, eq(testQuestions.questionId, questions.id))
      .where(eq(testQuestions.testId, testId))
      .orderBy(asc(testQuestions.order));

    return result.map((r) => r.question);
  }

  async getTestAttempt(id: string): Promise<TestAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, id));
    return attempt || undefined;
  }

  async getUserTestAttempts(userId: string, limit: number = 20): Promise<TestAttempt[]> {
    return await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.userId, userId))
      .orderBy(desc(testAttempts.startedAt))
      .limit(limit);
  }

  async getTestAttemptsByTestId(testId: string, status?: string): Promise<TestAttempt[]> {
    const conditions = [eq(testAttempts.testId, testId)];
    if (status) {
      conditions.push(eq(testAttempts.status, status as any));
    }
    return await db
      .select()
      .from(testAttempts)
      .where(and(...conditions))
      .orderBy(desc(testAttempts.startedAt));
  }

  async createTestAttempt(insertAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const [attempt] = await db
      .insert(testAttempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }

  async updateTestAttempt(id: string, data: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined> {
    const [attempt] = await db
      .update(testAttempts)
      .set(data)
      .where(eq(testAttempts.id, id))
      .returning();
    return attempt || undefined;
  }

  async createTestResponse(insertResponse: InsertTestResponse): Promise<TestResponse> {
    const [response] = await db
      .insert(testResponses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async updateTestResponse(id: string, data: Partial<InsertTestResponse>): Promise<TestResponse | undefined> {
    const [response] = await db
      .update(testResponses)
      .set(data)
      .where(eq(testResponses.id, id))
      .returning();
    return response || undefined;
  }

  async getTestAttemptResponses(attemptId: string): Promise<TestResponse[]> {
    return await db
      .select()
      .from(testResponses)
      .where(eq(testResponses.attemptId, attemptId))
      .orderBy(asc(testResponses.createdAt));
  }

  async getTestResponse(attemptId: string, questionId: string): Promise<TestResponse | undefined> {
    const [response] = await db
      .select()
      .from(testResponses)
      .where(and(
        eq(testResponses.attemptId, attemptId),
        eq(testResponses.questionId, questionId)
      ));
    return response || undefined;
  }
}
