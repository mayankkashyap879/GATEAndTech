import {
  testSeries,
  testSeriesTests,
  userPurchases,
  transactions,
  tests,
  type TestSeries,
  type InsertTestSeries,
  type TestSeriesTest,
  type UserPurchase,
  type InsertUserPurchase,
  type Transaction,
  type InsertTransaction,
  type Test,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, asc } from "drizzle-orm";

export class PaymentStorage {
  async getTestSeries(id: string): Promise<TestSeries | undefined> {
    const [series] = await db
      .select()
      .from(testSeries)
      .where(eq(testSeries.id, id));
    return series || undefined;
  }

  async getAllTestSeries(filters?: { isActive?: boolean }): Promise<TestSeries[]> {
    const query = filters?.isActive !== undefined
      ? db.select().from(testSeries).where(eq(testSeries.isActive, filters.isActive))
      : db.select().from(testSeries);

    return await query.orderBy(asc(testSeries.price));
  }

  async createTestSeries(insertTestSeries: InsertTestSeries): Promise<TestSeries> {
    const [series] = await db
      .insert(testSeries)
      .values(insertTestSeries)
      .returning();
    return series;
  }

  async updateTestSeries(id: string, data: Partial<InsertTestSeries>): Promise<TestSeries | undefined> {
    const [series] = await db
      .update(testSeries)
      .set(data)
      .where(eq(testSeries.id, id))
      .returning();
    return series || undefined;
  }

  async addTestToSeries(testSeriesId: string, testId: string, order: number): Promise<void> {
    await db
      .insert(testSeriesTests)
      .values({ testSeriesId, testId, order });
  }

  async removeTestFromSeries(testSeriesId: string, testId: string): Promise<void> {
    await db
      .delete(testSeriesTests)
      .where(
        and(
          eq(testSeriesTests.testSeriesId, testSeriesId),
          eq(testSeriesTests.testId, testId)
        )
      );
  }

  async getTestSeriesTests(testSeriesId: string): Promise<Test[]> {
    const result = await db
      .select({
        test: tests,
      })
      .from(testSeriesTests)
      .innerJoin(tests, eq(testSeriesTests.testId, tests.id))
      .where(eq(testSeriesTests.testSeriesId, testSeriesId))
      .orderBy(asc(testSeriesTests.order));

    return result.map(r => r.test);
  }

  async getTestSeriesByTestId(testId: string): Promise<TestSeries | undefined> {
    const result = await db
      .select({
        testSeries: testSeries,
      })
      .from(testSeriesTests)
      .innerJoin(testSeries, eq(testSeriesTests.testSeriesId, testSeries.id))
      .where(eq(testSeriesTests.testId, testId))
      .limit(1);

    return result[0]?.testSeries || undefined;
  }

  async getTestSeriesTestsByTestId(testId: string): Promise<TestSeriesTest[]> {
    return await db
      .select()
      .from(testSeriesTests)
      .where(eq(testSeriesTests.testId, testId));
  }

  async getUserPurchase(userId: string, testSeriesId: string): Promise<UserPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(userPurchases)
      .where(
        and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.testSeriesId, testSeriesId)
        )
      );
    return purchase || undefined;
  }

  async getUserPurchases(userId: string, filters?: { status?: string }): Promise<UserPurchase[]> {
    const conditions = [eq(userPurchases.userId, userId)];
    
    if (filters?.status) {
      conditions.push(eq(userPurchases.status, filters.status as any));
    }

    return await db
      .select()
      .from(userPurchases)
      .where(and(...conditions))
      .orderBy(desc(userPurchases.purchaseDate));
  }

  async createUserPurchase(insertPurchase: InsertUserPurchase): Promise<UserPurchase> {
    const [purchase] = await db
      .insert(userPurchases)
      .values(insertPurchase)
      .returning();
    return purchase;
  }

  async updateUserPurchase(id: string, data: Partial<InsertUserPurchase>): Promise<UserPurchase | undefined> {
    const [purchase] = await db
      .update(userPurchases)
      .set(data)
      .where(eq(userPurchases.id, id))
      .returning();
    return purchase || undefined;
  }

  async checkUserHasAccess(userId: string, testSeriesId: string): Promise<boolean> {
    const [purchase] = await db
      .select()
      .from(userPurchases)
      .where(
        and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.testSeriesId, testSeriesId),
          eq(userPurchases.status, "active")
        )
      );
    
    if (!purchase) return false;
    
    const now = new Date();
    return purchase.expiryDate > now;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionByOrderId(orderId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.razorpayOrderId, orderId));
    return transaction || undefined;
  }

  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }
}
