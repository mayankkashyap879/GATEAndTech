import {
  questions,
  topics,
  questionTopics,
  type Question,
  type InsertQuestion,
  type Topic,
  type InsertTopic,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, asc } from "drizzle-orm";

export class QuestionStorage {
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
}
