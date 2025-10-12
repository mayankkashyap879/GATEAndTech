// Referenced from blueprint:javascript_database integration
import { 
  users, 
  sessions,
  verificationTokens,
  questions,
  topics,
  questionTopics,
  tests,
  testQuestions,
  testAttempts,
  testResponses,
  testSeries,
  testSeriesTests,
  userPurchases,
  transactions,
  discussionThreads,
  discussionPosts,
  notifications,
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
  type VerificationToken,
  type InsertVerificationToken,
  type Question,
  type InsertQuestion,
  type Topic,
  type InsertTopic,
  type Test,
  type InsertTest,
  type TestAttempt,
  type InsertTestAttempt,
  type TestResponse,
  type InsertTestResponse,
  type TestSeries,
  type InsertTestSeries,
  type TestSeriesTest,
  type InsertTestSeriesTest,
  type UserPurchase,
  type InsertUserPurchase,
  type Transaction,
  type InsertTransaction,
  type DiscussionThread,
  type InsertDiscussionThread,
  type DiscussionPost,
  type InsertDiscussionPost,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, asc, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  upsertOAuthUser(data: {
    email: string;
    name: string;
    authProvider: "google" | "github";
    providerId: string;
    avatar?: string;
  }): Promise<User>;
  
  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  
  // Password Reset Token operations
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken>;
  getPasswordResetToken(token: string): Promise<VerificationToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  deleteUserPasswordResetTokens(userId: string): Promise<void>;
  
  // Question operations
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestions(filters?: { 
    topicId?: string; 
    difficulty?: string; 
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<void>;
  addQuestionTopic(questionId: string, topicId: string): Promise<void>;
  removeQuestionTopic(questionId: string, topicId: string): Promise<void>;
  getQuestionTopics(questionId: string): Promise<Topic[]>;
  
  // Topic operations
  getTopic(id: string): Promise<Topic | undefined>;
  getTopics(): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Test operations
  getTest(id: string): Promise<Test | undefined>;
  getTests(filters?: { 
    status?: string; 
    isPro?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, data: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: string): Promise<void>;
  addQuestionsToTest(testId: string, questionIds: string[]): Promise<void>;
  getTestQuestions(testId: string): Promise<Question[]>;
  
  // Test Attempt operations
  getTestAttempt(id: string): Promise<TestAttempt | undefined>;
  getUserTestAttempts(userId: string, limit?: number): Promise<TestAttempt[]>;
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  updateTestAttempt(id: string, data: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined>;
  
  // Test Response operations
  createTestResponse(response: InsertTestResponse): Promise<TestResponse>;
  updateTestResponse(id: string, data: Partial<InsertTestResponse>): Promise<TestResponse | undefined>;
  getTestAttemptResponses(attemptId: string): Promise<TestResponse[]>;
  getTestResponse(attemptId: string, questionId: string): Promise<TestResponse | undefined>;
  
  // Test Series operations
  getTestSeries(id: string): Promise<TestSeries | undefined>;
  getAllTestSeries(filters?: { isActive?: boolean }): Promise<TestSeries[]>;
  createTestSeries(testSeries: InsertTestSeries): Promise<TestSeries>;
  updateTestSeries(id: string, data: Partial<InsertTestSeries>): Promise<TestSeries | undefined>;
  addTestToSeries(testSeriesId: string, testId: string, order: number): Promise<void>;
  removeTestFromSeries(testSeriesId: string, testId: string): Promise<void>;
  getTestSeriesTests(testSeriesId: string): Promise<Test[]>;
  getTestSeriesByTestId(testId: string): Promise<TestSeries | undefined>;
  getTestSeriesTestsByTestId(testId: string): Promise<TestSeriesTest[]>;
  
  // User Purchase operations
  getUserPurchase(userId: string, testSeriesId: string): Promise<UserPurchase | undefined>;
  getUserPurchases(userId: string, filters?: { status?: string }): Promise<UserPurchase[]>;
  createUserPurchase(purchase: InsertUserPurchase): Promise<UserPurchase>;
  updateUserPurchase(id: string, data: Partial<InsertUserPurchase>): Promise<UserPurchase | undefined>;
  checkUserHasAccess(userId: string, testSeriesId: string): Promise<boolean>;
  
  // Transaction operations
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByOrderId(orderId: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  
  // Discussion operations
  getThread(id: string): Promise<DiscussionThread | undefined>;
  getThreads(filters?: { topicId?: string; limit?: number; offset?: number }): Promise<DiscussionThread[]>;
  createThread(thread: InsertDiscussionThread): Promise<DiscussionThread>;
  getThreadPosts(threadId: string): Promise<DiscussionPost[]>;
  createPost(post: InsertDiscussionPost): Promise<DiscussionPost>;
  
  // Analytics operations
  getUserPerformanceStats(userId: string): Promise<{
    totalTests: number;
    averageScore: number;
    averagePercentage: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    averageTimeTaken: number;
    accuracy: number;
  }>;
  getTopicWisePerformance(userId: string): Promise<Array<{
    topicId: string;
    topicName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }>>;
  getDifficultyWisePerformance(userId: string): Promise<Array<{
    difficulty: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }>>;
  getPerformanceTrend(userId: string, limit?: number): Promise<Array<{
    attemptId: string;
    testTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    submittedAt: Date;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertOAuthUser(data: {
    email: string;
    name: string;
    authProvider: "google" | "github";
    providerId: string;
    avatar?: string;
  }): Promise<User> {
    // Check if user exists with this provider
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.authProvider, data.authProvider),
          eq(users.providerId, data.providerId)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          name: data.name,
          avatar: data.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      return user;
    }

    // Check if email already exists (user signed up with email/password)
    const userByEmail = await this.getUserByEmail(data.email);
    if (userByEmail) {
      // Link OAuth provider to existing account
      const [user] = await db
        .update(users)
        .set({
          authProvider: data.authProvider,
          providerId: data.providerId,
          avatar: data.avatar || userByEmail.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userByEmail.id))
        .returning();
      return user;
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        authProvider: data.authProvider,
        providerId: data.providerId,
        avatar: data.avatar,
        role: "student",
        theme: "system",
        twofaEnabled: false,
      })
      .returning();
    return newUser;
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  // ============================================================================
  // PASSWORD RESET TOKEN OPERATIONS
  // ============================================================================

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken> {
    const [resetToken] = await db
      .insert(verificationTokens)
      .values({
        userId,
        token,
        type: 'password_reset',
        expiresAt,
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<VerificationToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, 'password_reset')
        )
      );
    return resetToken || undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, 'password_reset')
        )
      );
  }

  async deleteUserPasswordResetTokens(userId: string): Promise<void> {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, 'password_reset')
        )
      );
  }

  // ============================================================================
  // QUESTION OPERATIONS
  // ============================================================================

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return question || undefined;
  }

  async getQuestions(filters?: {
    topicId?: string;
    difficulty?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Question[]> {
    // If filtering by topic, use a join
    if (filters?.topicId) {
      const conditions = [eq(questions.isPublished, true), eq(questionTopics.topicId, filters.topicId)];

      if (filters?.difficulty) {
        conditions.push(eq(questions.difficulty, filters.difficulty as any));
      }

      if (filters?.type) {
        conditions.push(eq(questions.type, filters.type as any));
      }

      const results = await db
        .select({ question: questions })
        .from(questionTopics)
        .innerJoin(questions, eq(questionTopics.questionId, questions.id))
        .where(and(...conditions))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0);

      return results.map(r => r.question);
    }

    // Otherwise, simple query without join
    const conditions = [eq(questions.isPublished, true)];

    if (filters?.difficulty) {
      conditions.push(eq(questions.difficulty, filters.difficulty as any));
    }
    if (filters?.type) {
      conditions.push(eq(questions.type, filters.type as any));
    }

    return await db
      .select()
      .from(questions)
      .where(and(...conditions))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db
      .update(questions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question || undefined;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async addQuestionTopic(questionId: string, topicId: string): Promise<void> {
    await db.insert(questionTopics).values({ questionId, topicId });
  }

  async removeQuestionTopic(questionId: string, topicId: string): Promise<void> {
    await db.delete(questionTopics)
      .where(and(
        eq(questionTopics.questionId, questionId),
        eq(questionTopics.topicId, topicId)
      ));
  }

  async getQuestionTopics(questionId: string): Promise<Topic[]> {
    const results = await db
      .select({ topic: topics })
      .from(questionTopics)
      .innerJoin(topics, eq(questionTopics.topicId, topics.id))
      .where(eq(questionTopics.questionId, questionId));
    return results.map(r => r.topic);
  }

  // ============================================================================
  // TOPIC OPERATIONS
  // ============================================================================

  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic || undefined;
  }

  async getTopics(): Promise<Topic[]> {
    return await db.select().from(topics).orderBy(asc(topics.name));
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db
      .insert(topics)
      .values(insertTopic)
      .returning();
    return topic;
  }

  // ============================================================================
  // TEST OPERATIONS
  // ============================================================================

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

  // ============================================================================
  // TEST ATTEMPT OPERATIONS
  // ============================================================================

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

  // ============================================================================
  // TEST RESPONSE OPERATIONS
  // ============================================================================

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

  // ============================================================================
  // TEST SERIES OPERATIONS
  // ============================================================================

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

  // ============================================================================
  // USER PURCHASE OPERATIONS
  // ============================================================================

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
    
    // Check if not expired
    const now = new Date();
    return purchase.expiryDate > now;
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

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

  // ============================================================================
  // DISCUSSION OPERATIONS
  // ============================================================================

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

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

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
    // Get all submitted attempts for the user
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

    // Get all responses for these attempts
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
    // Get all submitted attempts for the user
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

    // Get responses with question topics
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

    // Group by topic
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

export const storage = new DatabaseStorage();
