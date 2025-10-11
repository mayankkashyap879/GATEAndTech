// Referenced from blueprint:javascript_database integration
import { 
  users, 
  sessions,
  questions,
  topics,
  questionTopics,
  tests,
  testQuestions,
  testAttempts,
  testResponses,
  subscriptions,
  discussionThreads,
  discussionPosts,
  notifications,
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
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
  type Subscription,
  type InsertSubscription,
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
  
  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  
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
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Discussion operations
  getThread(id: string): Promise<DiscussionThread | undefined>;
  getThreads(filters?: { topicId?: string; limit?: number; offset?: number }): Promise<DiscussionThread[]>;
  createThread(thread: InsertDiscussionThread): Promise<DiscussionThread>;
  getThreadPosts(threadId: string): Promise<DiscussionPost[]>;
  createPost(post: InsertDiscussionPost): Promise<DiscussionPost>;
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

  // ============================================================================
  // SUBSCRIPTION OPERATIONS
  // ============================================================================

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
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
}

export const storage = new DatabaseStorage();
