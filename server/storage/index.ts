import { UserStorage } from "./user.storage";
import { QuestionStorage } from "./question.storage";
import { TestStorage } from "./test.storage";
import { PaymentStorage } from "./payment.storage";
import { DiscussionStorage } from "./discussion.storage";
import type {
  User,
  InsertUser,
  Session,
  InsertSession,
  VerificationToken,
  Question,
  InsertQuestion,
  Topic,
  InsertTopic,
  Test,
  InsertTest,
  TestAttempt,
  InsertTestAttempt,
  TestResponse,
  InsertTestResponse,
  TestSeries,
  InsertTestSeries,
  TestSeriesTest,
  UserPurchase,
  InsertUserPurchase,
  Transaction,
  InsertTransaction,
  DiscussionThread,
  InsertDiscussionThread,
  DiscussionPost,
  InsertDiscussionPost,
} from "@shared/schema";

export interface IStorage {
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
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken>;
  getPasswordResetToken(token: string): Promise<VerificationToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  deleteUserPasswordResetTokens(userId: string): Promise<void>;
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
  getTopic(id: string): Promise<Topic | undefined>;
  getTopics(): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
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
  getTestAttempt(id: string): Promise<TestAttempt | undefined>;
  getUserTestAttempts(userId: string, limit?: number): Promise<TestAttempt[]>;
  getTestAttemptsByTestId(testId: string, status?: string): Promise<TestAttempt[]>;
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  updateTestAttempt(id: string, data: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined>;
  createTestResponse(response: InsertTestResponse): Promise<TestResponse>;
  updateTestResponse(id: string, data: Partial<InsertTestResponse>): Promise<TestResponse | undefined>;
  getTestAttemptResponses(attemptId: string): Promise<TestResponse[]>;
  getTestResponse(attemptId: string, questionId: string): Promise<TestResponse | undefined>;
  getTestSeries(id: string): Promise<TestSeries | undefined>;
  getAllTestSeries(filters?: { isActive?: boolean }): Promise<TestSeries[]>;
  createTestSeries(testSeries: InsertTestSeries): Promise<TestSeries>;
  updateTestSeries(id: string, data: Partial<InsertTestSeries>): Promise<TestSeries | undefined>;
  addTestToSeries(testSeriesId: string, testId: string, order: number): Promise<void>;
  removeTestFromSeries(testSeriesId: string, testId: string): Promise<void>;
  getTestSeriesTests(testSeriesId: string): Promise<Test[]>;
  getTestSeriesByTestId(testId: string): Promise<TestSeries | undefined>;
  getTestSeriesTestsByTestId(testId: string): Promise<TestSeriesTest[]>;
  getUserPurchase(userId: string, testSeriesId: string): Promise<UserPurchase | undefined>;
  getUserPurchases(userId: string, filters?: { status?: string }): Promise<UserPurchase[]>;
  createUserPurchase(purchase: InsertUserPurchase): Promise<UserPurchase>;
  updateUserPurchase(id: string, data: Partial<InsertUserPurchase>): Promise<UserPurchase | undefined>;
  checkUserHasAccess(userId: string, testSeriesId: string): Promise<boolean>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByOrderId(orderId: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  getThread(id: string): Promise<DiscussionThread | undefined>;
  getThreads(filters?: { topicId?: string; limit?: number; offset?: number }): Promise<DiscussionThread[]>;
  createThread(thread: InsertDiscussionThread): Promise<DiscussionThread>;
  getPost(id: string): Promise<DiscussionPost | undefined>;
  getThreadPosts(threadId: string): Promise<DiscussionPost[]>;
  createPost(post: InsertDiscussionPost): Promise<DiscussionPost>;
  updatePost(id: string, data: Partial<InsertDiscussionPost>): Promise<DiscussionPost | undefined>;
  incrementPostUpvotes(id: string, amount: number): Promise<void>;
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

export class Storage implements IStorage {
  private userStorage: UserStorage;
  private questionStorage: QuestionStorage;
  private testStorage: TestStorage;
  private paymentStorage: PaymentStorage;
  private discussionStorage: DiscussionStorage;

  constructor() {
    this.userStorage = new UserStorage();
    this.questionStorage = new QuestionStorage();
    this.testStorage = new TestStorage();
    this.paymentStorage = new PaymentStorage();
    this.discussionStorage = new DiscussionStorage();
  }

  getUser(id: string): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  createUser(user: InsertUser): Promise<User> {
    return this.userStorage.createUser(user);
  }

  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    return this.userStorage.updateUser(id, data);
  }

  upsertOAuthUser(data: {
    email: string;
    name: string;
    authProvider: "google" | "github";
    providerId: string;
    avatar?: string;
  }): Promise<User> {
    return this.userStorage.upsertOAuthUser(data);
  }

  createSession(session: InsertSession): Promise<Session> {
    return this.userStorage.createSession(session);
  }

  getSession(token: string): Promise<Session | undefined> {
    return this.userStorage.getSession(token);
  }

  deleteSession(token: string): Promise<void> {
    return this.userStorage.deleteSession(token);
  }

  deleteUserSessions(userId: string): Promise<void> {
    return this.userStorage.deleteUserSessions(userId);
  }

  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken> {
    return this.userStorage.createPasswordResetToken(userId, token, expiresAt);
  }

  getPasswordResetToken(token: string): Promise<VerificationToken | undefined> {
    return this.userStorage.getPasswordResetToken(token);
  }

  deletePasswordResetToken(token: string): Promise<void> {
    return this.userStorage.deletePasswordResetToken(token);
  }

  deleteUserPasswordResetTokens(userId: string): Promise<void> {
    return this.userStorage.deleteUserPasswordResetTokens(userId);
  }

  getQuestion(id: string): Promise<Question | undefined> {
    return this.questionStorage.getQuestion(id);
  }

  getQuestions(filters?: { 
    topicId?: string; 
    difficulty?: string; 
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Question[]> {
    return this.questionStorage.getQuestions(filters);
  }

  createQuestion(question: InsertQuestion): Promise<Question> {
    return this.questionStorage.createQuestion(question);
  }

  updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question | undefined> {
    return this.questionStorage.updateQuestion(id, data);
  }

  deleteQuestion(id: string): Promise<void> {
    return this.questionStorage.deleteQuestion(id);
  }

  addQuestionTopic(questionId: string, topicId: string): Promise<void> {
    return this.questionStorage.addQuestionTopic(questionId, topicId);
  }

  removeQuestionTopic(questionId: string, topicId: string): Promise<void> {
    return this.questionStorage.removeQuestionTopic(questionId, topicId);
  }

  getQuestionTopics(questionId: string): Promise<Topic[]> {
    return this.questionStorage.getQuestionTopics(questionId);
  }

  getTopic(id: string): Promise<Topic | undefined> {
    return this.questionStorage.getTopic(id);
  }

  getTopics(): Promise<Topic[]> {
    return this.questionStorage.getTopics();
  }

  createTopic(topic: InsertTopic): Promise<Topic> {
    return this.questionStorage.createTopic(topic);
  }

  getTest(id: string): Promise<Test | undefined> {
    return this.testStorage.getTest(id);
  }

  getTests(filters?: { 
    status?: string; 
    isPro?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Test[]> {
    return this.testStorage.getTests(filters);
  }

  createTest(test: InsertTest): Promise<Test> {
    return this.testStorage.createTest(test);
  }

  updateTest(id: string, data: Partial<InsertTest>): Promise<Test | undefined> {
    return this.testStorage.updateTest(id, data);
  }

  deleteTest(id: string): Promise<void> {
    return this.testStorage.deleteTest(id);
  }

  addQuestionsToTest(testId: string, questionIds: string[]): Promise<void> {
    return this.testStorage.addQuestionsToTest(testId, questionIds);
  }

  getTestQuestions(testId: string): Promise<Question[]> {
    return this.testStorage.getTestQuestions(testId);
  }

  getTestAttempt(id: string): Promise<TestAttempt | undefined> {
    return this.testStorage.getTestAttempt(id);
  }

  getUserTestAttempts(userId: string, limit?: number): Promise<TestAttempt[]> {
    return this.testStorage.getUserTestAttempts(userId, limit);
  }

  getTestAttemptsByTestId(testId: string, status?: string): Promise<TestAttempt[]> {
    return this.testStorage.getTestAttemptsByTestId(testId, status);
  }

  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt> {
    return this.testStorage.createTestAttempt(attempt);
  }

  updateTestAttempt(id: string, data: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined> {
    return this.testStorage.updateTestAttempt(id, data);
  }

  createTestResponse(response: InsertTestResponse): Promise<TestResponse> {
    return this.testStorage.createTestResponse(response);
  }

  updateTestResponse(id: string, data: Partial<InsertTestResponse>): Promise<TestResponse | undefined> {
    return this.testStorage.updateTestResponse(id, data);
  }

  getTestAttemptResponses(attemptId: string): Promise<TestResponse[]> {
    return this.testStorage.getTestAttemptResponses(attemptId);
  }

  getTestResponse(attemptId: string, questionId: string): Promise<TestResponse | undefined> {
    return this.testStorage.getTestResponse(attemptId, questionId);
  }

  getTestSeries(id: string): Promise<TestSeries | undefined> {
    return this.paymentStorage.getTestSeries(id);
  }

  getAllTestSeries(filters?: { isActive?: boolean }): Promise<TestSeries[]> {
    return this.paymentStorage.getAllTestSeries(filters);
  }

  createTestSeries(testSeries: InsertTestSeries): Promise<TestSeries> {
    return this.paymentStorage.createTestSeries(testSeries);
  }

  updateTestSeries(id: string, data: Partial<InsertTestSeries>): Promise<TestSeries | undefined> {
    return this.paymentStorage.updateTestSeries(id, data);
  }

  addTestToSeries(testSeriesId: string, testId: string, order: number): Promise<void> {
    return this.paymentStorage.addTestToSeries(testSeriesId, testId, order);
  }

  removeTestFromSeries(testSeriesId: string, testId: string): Promise<void> {
    return this.paymentStorage.removeTestFromSeries(testSeriesId, testId);
  }

  getTestSeriesTests(testSeriesId: string): Promise<Test[]> {
    return this.paymentStorage.getTestSeriesTests(testSeriesId);
  }

  getTestSeriesByTestId(testId: string): Promise<TestSeries | undefined> {
    return this.paymentStorage.getTestSeriesByTestId(testId);
  }

  getTestSeriesTestsByTestId(testId: string): Promise<TestSeriesTest[]> {
    return this.paymentStorage.getTestSeriesTestsByTestId(testId);
  }

  getUserPurchase(userId: string, testSeriesId: string): Promise<UserPurchase | undefined> {
    return this.paymentStorage.getUserPurchase(userId, testSeriesId);
  }

  getUserPurchases(userId: string, filters?: { status?: string }): Promise<UserPurchase[]> {
    return this.paymentStorage.getUserPurchases(userId, filters);
  }

  createUserPurchase(purchase: InsertUserPurchase): Promise<UserPurchase> {
    return this.paymentStorage.createUserPurchase(purchase);
  }

  updateUserPurchase(id: string, data: Partial<InsertUserPurchase>): Promise<UserPurchase | undefined> {
    return this.paymentStorage.updateUserPurchase(id, data);
  }

  checkUserHasAccess(userId: string, testSeriesId: string): Promise<boolean> {
    return this.paymentStorage.checkUserHasAccess(userId, testSeriesId);
  }

  getTransaction(id: string): Promise<Transaction | undefined> {
    return this.paymentStorage.getTransaction(id);
  }

  getTransactionByOrderId(orderId: string): Promise<Transaction | undefined> {
    return this.paymentStorage.getTransactionByOrderId(orderId);
  }

  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    return this.paymentStorage.getUserTransactions(userId, limit);
  }

  createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    return this.paymentStorage.createTransaction(transaction);
  }

  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    return this.paymentStorage.updateTransaction(id, data);
  }

  getThread(id: string): Promise<DiscussionThread | undefined> {
    return this.discussionStorage.getThread(id);
  }

  getThreads(filters?: { topicId?: string; limit?: number; offset?: number }): Promise<DiscussionThread[]> {
    return this.discussionStorage.getThreads(filters);
  }

  createThread(thread: InsertDiscussionThread): Promise<DiscussionThread> {
    return this.discussionStorage.createThread(thread);
  }

  getPost(id: string): Promise<DiscussionPost | undefined> {
    return this.discussionStorage.getPost(id);
  }

  getThreadPosts(threadId: string): Promise<DiscussionPost[]> {
    return this.discussionStorage.getThreadPosts(threadId);
  }

  createPost(post: InsertDiscussionPost): Promise<DiscussionPost> {
    return this.discussionStorage.createPost(post);
  }

  updatePost(id: string, data: Partial<InsertDiscussionPost>): Promise<DiscussionPost | undefined> {
    return this.discussionStorage.updatePost(id, data);
  }

  incrementPostUpvotes(id: string, amount: number): Promise<void> {
    return this.discussionStorage.incrementPostUpvotes(id, amount);
  }

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
  }> {
    return this.discussionStorage.getUserPerformanceStats(userId);
  }

  getTopicWisePerformance(userId: string): Promise<Array<{
    topicId: string;
    topicName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }>> {
    return this.discussionStorage.getTopicWisePerformance(userId);
  }

  getDifficultyWisePerformance(userId: string): Promise<Array<{
    difficulty: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }>> {
    return this.discussionStorage.getDifficultyWisePerformance(userId);
  }

  getPerformanceTrend(userId: string, limit?: number): Promise<Array<{
    attemptId: string;
    testTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    submittedAt: Date;
  }>> {
    return this.discussionStorage.getPerformanceTrend(userId, limit);
  }
}

export const storage = new Storage();
