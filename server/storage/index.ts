import { UserStorage } from "./user.storage";
import { QuestionStorage } from "./question.storage";
import { TestStorage } from "./test.storage";
import { PaymentStorage } from "./payment.storage";
import { DiscussionStorage } from "./discussion.storage";
import { GamificationStorage } from "./gamification.storage";
import { CouponStorage } from "./coupon.storage";
import { InvoiceStorage } from "./invoice.storage";
import { BulkImportStorage } from "./bulkimport.storage";
import { CommentStorage } from "./comment.storage";
import { TestSectionStorage } from "./testsection.storage";
import type {
  User,
  InsertUser,
  Session,
  InsertSession,
  VerificationToken,
  Question,
  InsertQuestion,
  Subject,
  InsertSubject,
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
  UserPoints,
  InsertUserPoints,
  Badge,
  InsertBadge,
  UserBadge,
  InsertUserBadge,
  Coupon,
  InsertCoupon,
  Invoice,
  InsertInvoice,
  BulkImport,
  InsertBulkImport,
  Comment,
  InsertComment,
  CommentVote,
  InsertCommentVote,
  Flag,
  InsertFlag,
  TestSection,
  InsertTestSection,
  SectionQuestion,
  InsertSectionQuestion,
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
  createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken>;
  getEmailVerificationToken(token: string): Promise<VerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<void>;
  deleteUserEmailVerificationTokens(userId: string): Promise<void>;
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
  getTopicsBySubject(subjectId: string): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: string): Promise<void>;
  getSubject(id: string): Promise<Subject | undefined>;
  getSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<void>;
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
  upsertTestResponse(response: InsertTestResponse): Promise<TestResponse>;
  getTestSections(testId: string): Promise<any[]>;
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
  getUserPoints(userId: string): Promise<UserPoints | undefined>;
  createUserPoints(data: InsertUserPoints): Promise<UserPoints>;
  updateUserPoints(userId: string, data: Partial<InsertUserPoints>): Promise<UserPoints | undefined>;
  incrementUserPoints(userId: string, points: number): Promise<UserPoints | undefined>;
  updateStreak(userId: string, streak: number): Promise<UserPoints | undefined>;
  getLeaderboard(limit?: number): Promise<UserPoints[]>;
  getBadge(id: string): Promise<Badge | undefined>;
  getBadgeBySlug(slug: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(data: InsertBadge): Promise<Badge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  awardBadge(data: InsertUserBadge): Promise<UserBadge>;
  hasUserBadge(userId: string, badgeId: string): Promise<boolean>;
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getAllCoupons(filters?: { isActive?: boolean }): Promise<Coupon[]>;
  createCoupon(data: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, data: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;
  incrementCouponUsage(id: string): Promise<Coupon | undefined>;
  validateCoupon(code: string, testSeriesId?: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByPurchaseId(purchaseId: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  generateInvoiceNumber(): Promise<string>;
  getBulkImport(id: string): Promise<BulkImport | undefined>;
  getUserBulkImports(userId: string, limit?: number): Promise<BulkImport[]>;
  createBulkImport(data: InsertBulkImport): Promise<BulkImport>;
  updateBulkImport(id: string, data: Partial<InsertBulkImport>): Promise<BulkImport | undefined>;
  updateBulkImportProgress(id: string, processedRows: number, successCount: number, errorCount: number): Promise<BulkImport | undefined>;
  completeBulkImport(id: string, errors?: any[]): Promise<BulkImport | undefined>;
  failBulkImport(id: string, errors: any[]): Promise<BulkImport | undefined>;
  getComment(id: string): Promise<Comment | undefined>;
  getQuestionComments(questionId: string): Promise<Comment[]>;
  getCommentReplies(parentCommentId: string): Promise<Comment[]>;
  createComment(data: InsertComment): Promise<Comment>;
  updateComment(id: string, data: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;
  incrementCommentUpvotes(id: string): Promise<Comment | undefined>;
  decrementCommentUpvotes(id: string): Promise<Comment | undefined>;
  getUserCommentVote(commentId: string, voterId: string): Promise<CommentVote | undefined>;
  createCommentVote(data: InsertCommentVote): Promise<CommentVote>;
  deleteCommentVote(commentId: string, voterId: string): Promise<void>;
  createFlag(data: InsertFlag): Promise<Flag>;
  getFlags(filters?: { status?: string }): Promise<Flag[]>;
  updateFlag(id: string, status: string): Promise<Flag | undefined>;
  getCommentFlags(commentId: string): Promise<Flag[]>;
  getTestSection(id: string): Promise<TestSection | undefined>;
  getTestSections(testId: string): Promise<TestSection[]>;
  createTestSection(data: InsertTestSection): Promise<TestSection>;
  updateTestSection(id: string, data: Partial<InsertTestSection>): Promise<TestSection | undefined>;
  deleteTestSection(id: string): Promise<void>;
  addQuestionToSection(data: InsertSectionQuestion): Promise<SectionQuestion>;
  removeQuestionFromSection(sectionId: string, questionId: string): Promise<void>;
  getSectionQuestions(sectionId: string): Promise<Question[]>;
  getQuestionVersions(questionId: string): Promise<Question[]>;
}

export class Storage implements IStorage {
  private userStorage: UserStorage;
  private questionStorage: QuestionStorage;
  private testStorage: TestStorage;
  private paymentStorage: PaymentStorage;
  private discussionStorage: DiscussionStorage;
  private gamificationStorage: GamificationStorage;
  private couponStorage: CouponStorage;
  private invoiceStorage: InvoiceStorage;
  private bulkImportStorage: BulkImportStorage;
  private commentStorage: CommentStorage;
  private testSectionStorage: TestSectionStorage;

  constructor() {
    this.userStorage = new UserStorage();
    this.questionStorage = new QuestionStorage();
    this.testStorage = new TestStorage();
    this.paymentStorage = new PaymentStorage();
    this.discussionStorage = new DiscussionStorage();
    this.gamificationStorage = new GamificationStorage();
    this.couponStorage = new CouponStorage();
    this.invoiceStorage = new InvoiceStorage();
    this.bulkImportStorage = new BulkImportStorage();
    this.commentStorage = new CommentStorage();
    this.testSectionStorage = new TestSectionStorage();
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

  createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken> {
    return this.userStorage.createEmailVerificationToken(userId, token, expiresAt);
  }

  getEmailVerificationToken(token: string): Promise<VerificationToken | undefined> {
    return this.userStorage.getEmailVerificationToken(token);
  }

  deleteEmailVerificationToken(token: string): Promise<void> {
    return this.userStorage.deleteEmailVerificationToken(token);
  }

  deleteUserEmailVerificationTokens(userId: string): Promise<void> {
    return this.userStorage.deleteUserEmailVerificationTokens(userId);
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

  getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return this.questionStorage.getTopicsBySubject(subjectId);
  }

  updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined> {
    return this.questionStorage.updateTopic(id, data);
  }

  deleteTopic(id: string): Promise<void> {
    return this.questionStorage.deleteTopic(id);
  }

  getSubject(id: string): Promise<Subject | undefined> {
    return this.questionStorage.getSubject(id);
  }

  getSubjects(): Promise<Subject[]> {
    return this.questionStorage.getSubjects();
  }

  createSubject(subject: InsertSubject): Promise<Subject> {
    return this.questionStorage.createSubject(subject);
  }

  updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined> {
    return this.questionStorage.updateSubject(id, data);
  }

  deleteSubject(id: string): Promise<void> {
    return this.questionStorage.deleteSubject(id);
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

  upsertTestResponse(response: InsertTestResponse): Promise<TestResponse> {
    return this.testStorage.upsertTestResponse(response);
  }

  getTestSections(testId: string): Promise<any[]> {
    return this.testStorage.getTestSections(testId);
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

  getUserPoints(userId: string): Promise<UserPoints | undefined> {
    return this.gamificationStorage.getUserPoints(userId);
  }

  createUserPoints(data: InsertUserPoints): Promise<UserPoints> {
    return this.gamificationStorage.createUserPoints(data);
  }

  updateUserPoints(userId: string, data: Partial<InsertUserPoints>): Promise<UserPoints | undefined> {
    return this.gamificationStorage.updateUserPoints(userId, data);
  }

  incrementUserPoints(userId: string, points: number): Promise<UserPoints | undefined> {
    return this.gamificationStorage.incrementUserPoints(userId, points);
  }

  updateStreak(userId: string, streak: number): Promise<UserPoints | undefined> {
    return this.gamificationStorage.updateStreak(userId, streak);
  }

  getLeaderboard(limit: number = 10): Promise<UserPoints[]> {
    return this.gamificationStorage.getLeaderboard(limit);
  }

  getBadge(id: string): Promise<Badge | undefined> {
    return this.gamificationStorage.getBadge(id);
  }

  getBadgeBySlug(slug: string): Promise<Badge | undefined> {
    return this.gamificationStorage.getBadgeBySlug(slug);
  }

  getAllBadges(): Promise<Badge[]> {
    return this.gamificationStorage.getAllBadges();
  }

  createBadge(data: InsertBadge): Promise<Badge> {
    return this.gamificationStorage.createBadge(data);
  }

  getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.gamificationStorage.getUserBadges(userId);
  }

  awardBadge(data: InsertUserBadge): Promise<UserBadge> {
    return this.gamificationStorage.awardBadge(data);
  }

  hasUserBadge(userId: string, badgeId: string): Promise<boolean> {
    return this.gamificationStorage.hasUserBadge(userId, badgeId);
  }

  getCoupon(id: string): Promise<Coupon | undefined> {
    return this.couponStorage.getCoupon(id);
  }

  getCouponByCode(code: string): Promise<Coupon | undefined> {
    return this.couponStorage.getCouponByCode(code);
  }

  getAllCoupons(filters?: { isActive?: boolean }): Promise<Coupon[]> {
    return this.couponStorage.getAllCoupons(filters);
  }

  createCoupon(data: InsertCoupon): Promise<Coupon> {
    return this.couponStorage.createCoupon(data);
  }

  updateCoupon(id: string, data: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    return this.couponStorage.updateCoupon(id, data);
  }

  deleteCoupon(id: string): Promise<void> {
    return this.couponStorage.deleteCoupon(id);
  }

  incrementCouponUsage(id: string): Promise<Coupon | undefined> {
    return this.couponStorage.incrementUsageCount(id);
  }

  validateCoupon(code: string, testSeriesId?: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    return this.couponStorage.validateCoupon(code, testSeriesId);
  }

  getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoiceStorage.getInvoice(id);
  }

  getInvoiceByPurchaseId(purchaseId: string): Promise<Invoice | undefined> {
    return this.invoiceStorage.getInvoiceByPurchaseId(purchaseId);
  }

  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return this.invoiceStorage.getInvoiceByNumber(invoiceNumber);
  }

  createInvoice(data: InsertInvoice): Promise<Invoice> {
    return this.invoiceStorage.createInvoice(data);
  }

  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    return this.invoiceStorage.updateInvoice(id, data);
  }

  generateInvoiceNumber(): Promise<string> {
    return this.invoiceStorage.generateInvoiceNumber();
  }

  getBulkImport(id: string): Promise<BulkImport | undefined> {
    return this.bulkImportStorage.getBulkImport(id);
  }

  getUserBulkImports(userId: string, limit: number = 20): Promise<BulkImport[]> {
    return this.bulkImportStorage.getUserBulkImports(userId, limit);
  }

  createBulkImport(data: InsertBulkImport): Promise<BulkImport> {
    return this.bulkImportStorage.createBulkImport(data);
  }

  updateBulkImport(id: string, data: Partial<InsertBulkImport>): Promise<BulkImport | undefined> {
    return this.bulkImportStorage.updateBulkImport(id, data);
  }

  updateBulkImportProgress(id: string, processedRows: number, successCount: number, errorCount: number): Promise<BulkImport | undefined> {
    return this.bulkImportStorage.updateProgress(id, processedRows, successCount, errorCount);
  }

  completeBulkImport(id: string, errors?: any[]): Promise<BulkImport | undefined> {
    return this.bulkImportStorage.completeImport(id, errors);
  }

  failBulkImport(id: string, errors: any[]): Promise<BulkImport | undefined> {
    return this.bulkImportStorage.failImport(id, errors);
  }

  getComment(id: string): Promise<Comment | undefined> {
    return this.commentStorage.getComment(id);
  }

  getQuestionComments(questionId: string): Promise<Comment[]> {
    return this.commentStorage.getQuestionComments(questionId);
  }

  getCommentReplies(parentCommentId: string): Promise<Comment[]> {
    return this.commentStorage.getCommentReplies(parentCommentId);
  }

  createComment(data: InsertComment): Promise<Comment> {
    return this.commentStorage.createComment(data);
  }

  updateComment(id: string, data: Partial<InsertComment>): Promise<Comment | undefined> {
    return this.commentStorage.updateComment(id, data);
  }

  deleteComment(id: string): Promise<void> {
    return this.commentStorage.deleteComment(id);
  }

  incrementCommentUpvotes(id: string): Promise<Comment | undefined> {
    return this.commentStorage.incrementUpvotes(id);
  }

  decrementCommentUpvotes(id: string): Promise<Comment | undefined> {
    return this.commentStorage.decrementUpvotes(id);
  }

  getUserCommentVote(commentId: string, voterId: string): Promise<CommentVote | undefined> {
    return this.commentStorage.getUserVote(commentId, voterId);
  }

  createCommentVote(data: InsertCommentVote): Promise<CommentVote> {
    return this.commentStorage.createVote(data);
  }

  deleteCommentVote(commentId: string, voterId: string): Promise<void> {
    return this.commentStorage.deleteVote(commentId, voterId);
  }

  createFlag(data: InsertFlag): Promise<Flag> {
    return this.commentStorage.createFlag(data);
  }

  getFlags(filters?: { status?: string }): Promise<Flag[]> {
    return this.commentStorage.getFlags(filters);
  }

  updateFlag(id: string, status: string): Promise<Flag | undefined> {
    return this.commentStorage.updateFlag(id, status);
  }

  getCommentFlags(commentId: string): Promise<Flag[]> {
    return this.commentStorage.getCommentFlags(commentId);
  }

  getTestSection(id: string): Promise<TestSection | undefined> {
    return this.testSectionStorage.getTestSection(id);
  }

  getTestSections(testId: string): Promise<TestSection[]> {
    return this.testSectionStorage.getTestSections(testId);
  }

  createTestSection(data: InsertTestSection): Promise<TestSection> {
    return this.testSectionStorage.createTestSection(data);
  }

  updateTestSection(id: string, data: Partial<InsertTestSection>): Promise<TestSection | undefined> {
    return this.testSectionStorage.updateTestSection(id, data);
  }

  deleteTestSection(id: string): Promise<void> {
    return this.testSectionStorage.deleteTestSection(id);
  }

  addQuestionToSection(data: InsertSectionQuestion): Promise<SectionQuestion> {
    return this.testSectionStorage.addQuestionToSection(data);
  }

  removeQuestionFromSection(sectionId: string, questionId: string): Promise<void> {
    return this.testSectionStorage.removeQuestionFromSection(sectionId, questionId);
  }

  getSectionQuestions(sectionId: string): Promise<Question[]> {
    return this.testSectionStorage.getSectionQuestions(sectionId);
  }

  async getQuestionVersions(questionId: string): Promise<Question[]> {
    return this.questionStorage.getQuestionVersions(questionId);
  }
}

export const storage: IStorage = new Storage();
