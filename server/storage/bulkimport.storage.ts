import { db } from "../db";
import { 
  bulkImports,
  type BulkImport,
  type InsertBulkImport
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class BulkImportStorage {
  async getBulkImport(id: string): Promise<BulkImport | undefined> {
    const result = await db.select().from(bulkImports).where(eq(bulkImports.id, id)).limit(1);
    return result[0];
  }

  async getUserBulkImports(userId: string, limit: number = 20): Promise<BulkImport[]> {
    return db.select()
      .from(bulkImports)
      .where(eq(bulkImports.userId, userId))
      .orderBy(desc(bulkImports.createdAt))
      .limit(limit);
  }

  async createBulkImport(data: InsertBulkImport): Promise<BulkImport> {
    const result = await db.insert(bulkImports).values(data).returning();
    return result[0];
  }

  async updateBulkImport(id: string, data: Partial<InsertBulkImport>): Promise<BulkImport | undefined> {
    const result = await db.update(bulkImports)
      .set(data)
      .where(eq(bulkImports.id, id))
      .returning();
    return result[0];
  }

  async updateProgress(id: string, processedRows: number, successCount: number, errorCount: number): Promise<BulkImport | undefined> {
    const result = await db.update(bulkImports)
      .set({ processedRows, successCount, errorCount })
      .where(eq(bulkImports.id, id))
      .returning();
    return result[0];
  }

  async completeImport(id: string, errors?: any[]): Promise<BulkImport | undefined> {
    const result = await db.update(bulkImports)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        errors: errors || []
      })
      .where(eq(bulkImports.id, id))
      .returning();
    return result[0];
  }

  async failImport(id: string, errors: any[]): Promise<BulkImport | undefined> {
    const result = await db.update(bulkImports)
      .set({ 
        status: 'failed',
        completedAt: new Date(),
        errors
      })
      .where(eq(bulkImports.id, id))
      .returning();
    return result[0];
  }
}
