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
export const attemptStatusEnum = pgEnum("attempt_status", ["in_progress", "processing", "submitted", "evaluated"]);
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

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  displayOrderIdx: index("subjects_display_order_idx").on(table.displayOrder),
}));

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  subjectIdx: index("topics_subject_idx").on(table.subjectId),
  slugSubjectUniq: unique().on(table.slug, table.subjectId),
}));

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
  versionNumber: integer("version_number").default(1).notNull(),
  parentVersionId: varchar("parent_version_id").references((): any => questions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("questions_type_idx").on(table.type),
  difficultyIdx: index("questions_difficulty_idx").on(table.difficulty),
  createdByIdx: index("questions_created_by_idx").on(table.createdBy),
  createdAtIdx: index("questions_created_at_idx").on(table.createdAt),
  parentVersionIdx: index("questions_parent_version_idx").on(table.parentVersionId),
  // Composite index for: WHERE isPublished = ? ORDER BY createdAt DESC
  publishedCreatedIdx: index("questions_published_created_idx").on(table.isPublished, table.createdAt.desc()),
}));

export const questionTopics = pgTable("question_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
}, (table) => ({
  questionIdx: index("question_topics_question_idx").on(table.questionId),
  topicIdx: index("question_topics_topic_idx").on(table.topicId),
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
  createdByIdx: index("tests_created_by_idx").on(table.createdBy),
  createdAtIdx: index("tests_created_at_idx").on(table.createdAt),
  // Composite index for: WHERE status = ? AND isPro = ? ORDER BY scheduledAt
  statusProScheduledIdx: index("tests_status_pro_scheduled_idx").on(table.status, table.isPro, table.scheduledAt),
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
  testIdx: index("test_attempts_test_idx").on(table.testId),
  statusIdx: index("test_attempts_status_idx").on(table.status),
  submittedAtIdx: index("test_attempts_submitted_at_idx").on(table.submittedAt),
  // Composite index for: WHERE userId = ? ORDER BY startedAt DESC
  userStartedIdx: index("test_attempts_user_started_idx").on(table.userId, table.startedAt.desc()),
  // Composite index for: WHERE userId = ? AND status = ? ORDER BY startedAt DESC
  userStatusStartedIdx: index("test_attempts_user_status_started_idx").on(table.userId, table.status, table.startedAt.desc()),
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
});

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
  testSeriesIdx: index("user_purchases_test_series_idx").on(table.testSeriesId),
  // Composite index for: WHERE userId = ? [AND status = ?] ORDER BY purchaseDate DESC
  userStatusDateIdx: index("user_purchases_user_status_date_idx").on(table.userId, table.status, table.purchaseDate.desc()),
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
  testSeriesIdx: index("transactions_test_series_idx").on(table.testSeriesId),
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
  questionIdx: index("discussion_threads_question_idx").on(table.questionId),
  createdAtIdx: index("discussion_threads_created_at_idx").on(table.createdAt),
  // Composite index for: WHERE topicId = ? ORDER BY isPinned DESC, updatedAt DESC
  topicPinnedUpdatedIdx: index("discussion_threads_topic_pinned_updated_idx").on(table.topicId, table.isPinned.desc(), table.updatedAt.desc()),
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
  authorIdx: index("discussion_posts_author_idx").on(table.authorId),
  // Composite index for: WHERE threadId = ? ORDER BY createdAt ASC
  threadCreatedIdx: index("discussion_posts_thread_created_idx").on(table.threadId, table.createdAt.asc()),
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
  // Composite index for: WHERE userId = ? [AND isRead = ?] ORDER BY createdAt DESC
  userReadCreatedIdx: index("notifications_user_read_created_idx").on(table.userId, table.isRead, table.createdAt.desc()),
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

// Subject schemas
export const insertSubjectSchema = createInsertSchema(subjects, {
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
}).omit({ id: true, createdAt: true });

export const selectSubjectSchema = createSelectSchema(subjects);

// Topic schemas  
export const insertTopicSchema = createInsertSchema(topics, {
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
}).omit({ id: true, createdAt: true });

export const selectTopicSchema = createSelectSchema(topics);

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
// PERMISSIONS & RBAC (CASL)
// ============================================================================

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(), // true for student, moderator, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("roles_name_idx").on(table.name),
}));

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete, publish, manage
  subject: varchar("subject", { length: 50 }).notNull(), // Question, Test, User, Role, etc.
  conditions: jsonb("conditions"), // Optional CASL conditions
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  actionSubjectIdx: unique("permissions_action_subject_idx").on(table.action, table.subject),
}));

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("role_permissions_role_idx").on(table.roleId),
  permissionIdx: index("role_permissions_permission_idx").on(table.permissionId),
  uniq: unique().on(table.roleId, table.permissionId),
}));

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'role.create', 'permission.assign'
  resource: varchar("resource", { length: 100 }).notNull(), // e.g., 'Role', 'Permission'
  resourceId: varchar("resource_id"),
  details: jsonb("details"), // Old/new values, additional context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceIdx: index("audit_logs_resource_idx").on(table.resource, table.resourceId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

// Permission schemas
export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(2).max(50),
  description: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPermissionSchema = createInsertSchema(permissions, {
  action: z.string().min(2).max(50),
  subject: z.string().min(2).max(50),
  description: z.string().optional(),
}).omit({ id: true, createdAt: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// ============================================================================
// ============================================================================

export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  points: integer("points").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  pointsIdx: index("user_points_points_idx").on(table.points.desc()),
}));

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: text("icon"), // Icon URL or emoji
  pointsRequired: integer("points_required").default(0).notNull(),
  category: varchar("category", { length: 50 }), // e.g., 'contributor', 'streak', 'achievement'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_badges_user_idx").on(table.userId),
  uniq: unique().on(table.userId, table.badgeId),
}));

// ============================================================================
// ============================================================================

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  expiryDate: timestamp("expiry_date"),
  usageLimit: integer("usage_limit"), // null = unlimited
  usedCount: integer("used_count").default(0).notNull(),
  applicableTestSeriesId: varchar("applicable_test_series_id").references(() => testSeries.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("coupons_code_idx").on(table.code),
  activeIdx: index("coupons_active_idx").on(table.isActive),
}));

// ============================================================================
// ============================================================================

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => userPurchases.id, { onDelete: "cascade" }).unique(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  fileUrl: text("file_url"),
  gstNumber: varchar("gst_number", { length: 50 }),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
  purchaseIdx: index("invoices_purchase_idx").on(table.purchaseId),
}));

// ============================================================================
// ============================================================================

export const importStatusEnum = pgEnum("import_status", ["pending", "processing", "completed", "failed"]);

export const bulkImports = pgTable("bulk_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // 'csv', 'qti'
  status: importStatusEnum("status").default("pending").notNull(),
  totalRows: integer("total_rows").default(0).notNull(),
  processedRows: integer("processed_rows").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  errorCount: integer("error_count").default(0).notNull(),
  errors: jsonb("errors"), // Array of error objects with row numbers
  jobId: text("job_id"), // BullMQ job ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdx: index("bulk_imports_user_idx").on(table.userId),
  statusIdx: index("bulk_imports_status_idx").on(table.status),
}));

// ============================================================================
// ============================================================================

export const commentStatusEnum = pgEnum("comment_status", ["active", "flagged", "pending", "deleted"]);

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  parentCommentId: varchar("parent_comment_id").references((): any => comments.id),
  body: text("body").notNull(),
  status: commentStatusEnum("status").default("active").notNull(),
  spamScore: numeric("spam_score", { precision: 5, scale: 2 }).default("0").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  questionIdx: index("comments_question_idx").on(table.questionId),
  authorIdx: index("comments_author_idx").on(table.authorId),
  parentIdx: index("comments_parent_idx").on(table.parentCommentId),
  statusIdx: index("comments_status_idx").on(table.status),
}));

export const commentVotes = pgTable("comment_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  voterId: varchar("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  value: integer("value").notNull(), // 1 for upvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  commentIdx: index("comment_votes_comment_idx").on(table.commentId),
  uniq: unique().on(table.commentId, table.voterId),
}));

export const flags = pgTable("flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  flaggerId: varchar("flagger_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'resolved', 'dismissed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  commentIdx: index("flags_comment_idx").on(table.commentId),
  statusIdx: index("flags_status_idx").on(table.status),
}));

// ============================================================================
// TEST SECTIONS
// ============================================================================

export const testSections = pgTable("test_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  testIdx: index("test_sections_test_idx").on(table.testId),
  orderIdx: index("test_sections_order_idx").on(table.testId, table.order),
}));

export const sectionQuestions = pgTable("section_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull().references(() => testSections.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
}, (table) => ({
  sectionIdx: index("section_questions_section_idx").on(table.sectionId),
  uniq: unique().on(table.sectionId, table.questionId),
}));

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, awardedAt: true });
export const insertCouponSchema = createInsertSchema(coupons, {
  code: z.string().min(3).max(50),
  discountValue: z.string().regex(/^\d+(\.\d{1,2})?$/),
}).omit({ id: true, createdAt: true, usedCount: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertBulkImportSchema = createInsertSchema(bulkImports).omit({ id: true, createdAt: true, completedAt: true });
export const insertCommentSchema = createInsertSchema(comments, {
  body: z.string().min(1).max(5000),
}).omit({ id: true, createdAt: true, updatedAt: true, upvotes: true, spamScore: true });
export const insertCommentVoteSchema = createInsertSchema(commentVotes).omit({ id: true, createdAt: true });
export const insertFlagSchema = createInsertSchema(flags).omit({ id: true, createdAt: true });
export const insertTestSectionSchema = createInsertSchema(testSections).omit({ id: true, createdAt: true });
export const insertSectionQuestionSchema = createInsertSchema(sectionQuestions).omit({ id: true });

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

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

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

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type BulkImport = typeof bulkImports.$inferSelect;
export type InsertBulkImport = z.infer<typeof insertBulkImportSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CommentVote = typeof commentVotes.$inferSelect;
export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;

export type Flag = typeof flags.$inferSelect;
export type InsertFlag = z.infer<typeof insertFlagSchema>;

export type TestSection = typeof testSections.$inferSelect;
export type InsertTestSection = z.infer<typeof insertTestSectionSchema>;

export type SectionQuestion = typeof sectionQuestions.$inferSelect;
export type InsertSectionQuestion = z.infer<typeof insertSectionQuestionSchema>;
