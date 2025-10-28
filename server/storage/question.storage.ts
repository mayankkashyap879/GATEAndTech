import {
  questions,
  topics,
  subjects,
  questionTopics,
  type Question,
  type InsertQuestion,
  type Topic,
  type InsertTopic,
  type Subject,
  type InsertSubject,
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

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return await db
      .select()
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(asc(topics.name));
  }

  async updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [topic] = await db
      .update(topics)
      .set(data)
      .where(eq(topics.id, id))
      .returning();
    return topic || undefined;
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(topics).where(eq(topics.id, id));
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(asc(subjects.displayOrder));
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(subjects)
      .values(insertSubject)
      .returning();
    return subject;
  }

  async updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [subject] = await db
      .update(subjects)
      .set(data)
      .where(eq(subjects.id, id))
      .returning();
    return subject || undefined;
  }

  async deleteSubject(id: string): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }
}
