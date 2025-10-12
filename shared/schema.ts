import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  integer, 
  numeric,
  jsonb,
  pgEnum,
  index,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum("role", ["student", "moderator", "admin"]);
export const authProviderEnum = pgEnum("auth_provider", ["credentials", "google", "github"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);
export const questionTypeEnum = pgEnum("question_type", ["mcq_single", "mcq_multiple", "numerical"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const testStatusEnum = pgEnum("test_status", ["draft", "published", "archived"]);
export const attemptStatusEnum = pgEnum("attempt_status", ["in_progress", "submitted", "evaluated"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed", "refunded"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["active", "expired"]);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  passwordHash: text("password_hash"),
  authProvider: authProviderEnum("auth_provider").default("credentials").notNull(),
  providerId: text("provider_id"),
  avatar: text("avatar"),
  role: roleEnum("role").default("student").notNull(),
  theme: themeEnum("theme").default("system").notNull(),
  twofaEnabled: boolean("twofa_enabled").default(false).notNull(),
  twofaSecret: text("twofa_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  providerIdx: index("users_provider_idx").on(table.authProvider, table.providerId),
}));

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("sessions_user_idx").on(table.userId),
  tokenIdx: index("sessions_token_idx").on(table.token),
}));

export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  type: text("type").notNull(), // 'email_verification', 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// QUESTION BANK
// ============================================================================

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subject: text("subject").notNull(), // e.g., "Computer Science", "Electronics", "Mathematics"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  type: questionTypeEnum("type").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  options: jsonb("options"), // Array of options for MCQ [{id: 'A', text: '...', isCorrect: boolean}]
  correctAnswer: text("correct_answer"), // For numerical type
  explanation: text("explanation"),
  marks: integer("marks").default(1).notNull(),
  negativeMarks: integer("negative_marks").default(0).notNull(),
  imageUrl: text("image_url"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("questions_type_idx").on(table.type),
  difficultyIdx: index("questions_difficulty_idx").on(table.difficulty),
}));

export const questionTopics = pgTable("question_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
}, (table) => ({
  uniq: unique().on(table.questionId, table.topicId),
}));

// ============================================================================
// TESTS & ATTEMPTS
// ============================================================================

export const tests = pgTable("tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  totalMarks: integer("total_marks").notNull(),
  status: testStatusEnum("status").default("draft").notNull(),
  isPro: boolean("is_pro").default(false).notNull(), // Only for pro users
  scheduledAt: timestamp("scheduled_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("tests_status_idx").on(table.status),
  scheduledIdx: index("tests_scheduled_idx").on(table.scheduledAt),
}));

export const testQuestions = pgTable("test_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
}, (table) => ({
  testIdx: index("test_questions_test_idx").on(table.testId),
  uniq: unique().on(table.testId, table.questionId),
}));

export const testAttempts = pgTable("test_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: attemptStatusEnum("status").default("in_progress").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  maxScore: integer("max_score"),
  percentile: integer("percentile"),
  timeTaken: integer("time_taken"), // in seconds
  responses: jsonb("responses"), // Stores all responses for quick access
}, (table) => ({
  userIdx: index("test_attempts_user_idx").on(table.userId),
  testIdx: index("test_attempts_test_idx").on(table.testId),
  statusIdx: index("test_attempts_status_idx").on(table.status),
}));

export const testResponses = pgTable("test_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => testAttempts.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  selectedAnswer: text("selected_answer"), // Option ID or numerical value
  isCorrect: boolean("is_correct"),
  marksAwarded: integer("marks_awarded").default(0),
  timeTaken: integer("time_taken"), // in seconds
  isMarkedForReview: boolean("is_marked_for_review").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  attemptIdx: index("test_responses_attempt_idx").on(table.attemptId),
  uniq: unique().on(table.attemptId, table.questionId),
}));

// ============================================================================
// TEST SERIES & PURCHASES
// ============================================================================

export const testSeries = pgTable("test_series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  validityDays: integer("validity_days").notNull().default(90),
  tier: varchar("tier", { length: 20 }).notNull().default("free"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  activeIdx: index("test_series_active_idx").on(table.isActive),
}));

export const testSeriesTests = pgTable("test_series_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testSeriesId: varchar("test_series_id").notNull().references(() => testSeries.id, { onDelete: "cascade" }),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  order: integer("sequence_order").notNull(),
}, (table) => ({
  seriesIdx: index("test_series_tests_series_idx").on(table.testSeriesId),
  uniq: unique().on(table.testSeriesId, table.testId),
}));

export const userPurchases = pgTable("user_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  testSeriesId: varchar("test_series_id").notNull().references(() => testSeries.id, { onDelete: "cascade" }),
  status: purchaseStatusEnum("status").default("active").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
}, (table) => ({
  userIdx: index("user_purchases_user_idx").on(table.userId),
  statusIdx: index("user_purchases_status_idx").on(table.status),
  expiryIdx: index("user_purchases_expiry_idx").on(table.expiryDate),
  uniq: unique().on(table.userId, table.testSeriesId),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  testSeriesId: varchar("test_series_id").references(() => testSeries.id),
  amount: integer("amount").notNull(), // in paise/cents
  currency: text("currency").default("INR").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpaySignature: text("razorpay_signature"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("transactions_user_idx").on(table.userId),
  orderIdx: index("transactions_order_idx").on(table.razorpayOrderId),
  statusIdx: index("transactions_status_idx").on(table.status),
}));

// ============================================================================
// COMMUNITY & DISCUSSIONS
// ============================================================================

export const discussionThreads = pgTable("discussion_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  topicId: varchar("topic_id").references(() => topics.id),
  questionId: varchar("question_id").references(() => questions.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  viewCount: integer("view_count").default(0).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  authorIdx: index("discussion_threads_author_idx").on(table.authorId),
  topicIdx: index("discussion_threads_topic_idx").on(table.topicId),
}));

export const discussionPosts = pgTable("discussion_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => discussionThreads.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  threadIdx: index("discussion_posts_thread_idx").on(table.threadId),
  authorIdx: index("discussion_posts_author_idx").on(table.authorId),
}));

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'test_reminder', 'result_available', 'discussion_reply', etc.
  relatedId: varchar("related_id"), // ID of related entity (test, thread, etc.)
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  readIdx: index("notifications_read_idx").on(table.isRead),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  questionsCreated: many(questions),
  testsCreated: many(tests),
  testSeriesCreated: many(testSeries),
  testAttempts: many(testAttempts),
  purchases: many(userPurchases),
  transactions: many(transactions),
  threadsCreated: many(discussionThreads),
  postsCreated: many(discussionPosts),
  notifications: many(notifications),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  creator: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),
  questionTopics: many(questionTopics),
  testQuestions: many(testQuestions),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  questionTopics: many(questionTopics),
  threads: many(discussionThreads),
}));

export const questionTopicsRelations = relations(questionTopics, ({ one }) => ({
  question: one(questions, {
    fields: [questionTopics.questionId],
    references: [questions.id],
  }),
  topic: one(topics, {
    fields: [questionTopics.topicId],
    references: [topics.id],
  }),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  creator: one(users, {
    fields: [tests.createdBy],
    references: [users.id],
  }),
  testQuestions: many(testQuestions),
  attempts: many(testAttempts),
}));

export const testQuestionsRelations = relations(testQuestions, ({ one }) => ({
  test: one(tests, {
    fields: [testQuestions.testId],
    references: [tests.id],
  }),
  question: one(questions, {
    fields: [testQuestions.questionId],
    references: [questions.id],
  }),
}));

export const testAttemptsRelations = relations(testAttempts, ({ one, many }) => ({
  test: one(tests, {
    fields: [testAttempts.testId],
    references: [tests.id],
  }),
  user: one(users, {
    fields: [testAttempts.userId],
    references: [users.id],
  }),
  responses: many(testResponses),
}));

export const testResponsesRelations = relations(testResponses, ({ one }) => ({
  attempt: one(testAttempts, {
    fields: [testResponses.attemptId],
    references: [testAttempts.id],
  }),
  question: one(questions, {
    fields: [testResponses.questionId],
    references: [questions.id],
  }),
}));

export const testSeriesRelations = relations(testSeries, ({ many }) => ({
  testSeriesTests: many(testSeriesTests),
  purchases: many(userPurchases),
  transactions: many(transactions),
}));

export const testSeriesTestsRelations = relations(testSeriesTests, ({ one }) => ({
  testSeries: one(testSeries, {
    fields: [testSeriesTests.testSeriesId],
    references: [testSeries.id],
  }),
  test: one(tests, {
    fields: [testSeriesTests.testId],
    references: [tests.id],
  }),
}));

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
  user: one(users, {
    fields: [userPurchases.userId],
    references: [users.id],
  }),
  testSeries: one(testSeries, {
    fields: [userPurchases.testSeriesId],
    references: [testSeries.id],
  }),
  transaction: one(transactions, {
    fields: [userPurchases.transactionId],
    references: [transactions.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  testSeries: one(testSeries, {
    fields: [transactions.testSeriesId],
    references: [testSeries.id],
  }),
}));

export const discussionThreadsRelations = relations(discussionThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [discussionThreads.authorId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [discussionThreads.topicId],
    references: [topics.id],
  }),
  question: one(questions, {
    fields: [discussionThreads.questionId],
    references: [questions.id],
  }),
  posts: many(discussionPosts),
}));

export const discussionPostsRelations = relations(discussionPosts, ({ one }) => ({
  thread: one(discussionThreads, {
    fields: [discussionPosts.threadId],
    references: [discussionThreads.id],
  }),
  author: one(users, {
    fields: [discussionPosts.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(2).max(100),
  passwordHash: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Registration schema - only allows user-provided fields
export const registerUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

// User profile update schema - only safe fields users can modify
export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

// Admin-only user update schema
export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional().nullable(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  role: z.enum(["student", "moderator", "admin"]).optional(),
  twofaEnabled: z.boolean().optional(),
});

export const selectUserSchema = createSelectSchema(users);

export const updateUserSchema = insertUserSchema.partial().omit({ 
  role: true, 
  authProvider: true, 
  providerId: true 
});

// Question schemas
export const insertQuestionSchema = createInsertSchema(questions, {
  content: z.string().min(10),
  marks: z.number().int().positive(),
  negativeMarks: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Update schema - only allows safe fields, excludes id, createdBy, createdAt, updatedAt
export const updateQuestionSchema = z.object({
  content: z.string().min(10).optional(),
  type: z.enum(["mcq_single", "mcq_multiple", "numerical"]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  options: z.any().optional(), // jsonb field
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  marks: z.number().int().positive().optional(),
  negativeMarks: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const selectQuestionSchema = createSelectSchema(questions);

// Test schemas
export const insertTestSchema = createInsertSchema(tests, {
  title: z.string().min(3).max(200),
  duration: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectTestSchema = createSelectSchema(tests);

// Test Attempt schemas
export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ 
  id: true, 
  startedAt: true, 
});

export const selectTestAttemptSchema = createSelectSchema(testAttempts);

// Test Series schemas
export const insertTestSeriesSchema = createInsertSchema(testSeries, {
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.string(), // numeric field comes as string
  validityDays: z.number().int().positive(),
  tier: z.enum(["free", "premium", "pro"]),
}).omit({ id: true, createdAt: true });

export const selectTestSeriesSchema = createSelectSchema(testSeries);

// User Purchase schemas
export const insertUserPurchaseSchema = createInsertSchema(userPurchases).omit({ 
  id: true, 
  purchaseDate: true 
});

export const selectUserPurchaseSchema = createSelectSchema(userPurchases);

// Transaction schemas
export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.number().int().positive(),
}).omit({ id: true, createdAt: true });

export const selectTransactionSchema = createSelectSchema(transactions);

// Payment verification schema
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Discussion schemas
export const insertThreadSchema = createInsertSchema(discussionThreads, {
  title: z.string().min(5).max(200),
  content: z.string().min(10),
}).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });

export const insertPostSchema = createInsertSchema(discussionPosts, {
  content: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true, upvotes: true });

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;

export type TestResponse = typeof testResponses.$inferSelect;
export type InsertTestResponse = typeof testResponses.$inferInsert;

export type TestSeries = typeof testSeries.$inferSelect;
export type InsertTestSeries = z.infer<typeof insertTestSeriesSchema>;

export type TestSeriesTest = typeof testSeriesTests.$inferSelect;
export type InsertTestSeriesTest = typeof testSeriesTests.$inferInsert;

export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = z.infer<typeof insertUserPurchaseSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type InsertDiscussionThread = z.infer<typeof insertThreadSchema>;

export type DiscussionPost = typeof discussionPosts.$inferSelect;
export type InsertDiscussionPost = z.infer<typeof insertPostSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
