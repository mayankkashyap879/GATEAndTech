import { db } from "../db";
import { 
  testSections,
  sectionQuestions,
  questions,
  type TestSection,
  type InsertTestSection,
  type SectionQuestion,
  type InsertSectionQuestion,
  type Question
} from "@shared/schema";
import { eq, asc, and } from "drizzle-orm";

export class TestSectionStorage {
  async getTestSection(id: string): Promise<TestSection | undefined> {
    const result = await db.select().from(testSections).where(eq(testSections.id, id)).limit(1);
    return result[0];
  }

  async getTestSections(testId: string): Promise<TestSection[]> {
    return db.select()
      .from(testSections)
      .where(eq(testSections.testId, testId))
      .orderBy(asc(testSections.order));
  }

  async createTestSection(data: InsertTestSection): Promise<TestSection> {
    const result = await db.insert(testSections).values(data).returning();
    return result[0];
  }

  async updateTestSection(id: string, data: Partial<InsertTestSection>): Promise<TestSection | undefined> {
    const result = await db.update(testSections)
      .set(data)
      .where(eq(testSections.id, id))
      .returning();
    return result[0];
  }

  async deleteTestSection(id: string): Promise<void> {
    await db.delete(testSections).where(eq(testSections.id, id));
  }

  async addQuestionToSection(data: InsertSectionQuestion): Promise<SectionQuestion> {
    const result = await db.insert(sectionQuestions).values(data).returning();
    return result[0];
  }

  async removeQuestionFromSection(sectionId: string, questionId: string): Promise<void> {
    await db.delete(sectionQuestions)
      .where(and(
        eq(sectionQuestions.sectionId, sectionId),
        eq(sectionQuestions.questionId, questionId)
      ));
  }

  async getSectionQuestions(sectionId: string): Promise<Question[]> {
    const result = await db.select({
      question: questions
    })
      .from(sectionQuestions)
      .innerJoin(questions, eq(sectionQuestions.questionId, questions.id))
      .where(eq(sectionQuestions.sectionId, sectionId))
      .orderBy(asc(sectionQuestions.order));
    
    return result.map((r: { question: Question }) => r.question);
  }
}
