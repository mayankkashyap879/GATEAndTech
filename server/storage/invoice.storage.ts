import { db } from "../db";
import { 
  invoices,
  type Invoice,
  type InsertInvoice
} from "@shared/schema";
import { eq } from "drizzle-orm";

export class InvoiceStorage {
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoiceByPurchaseId(purchaseId: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.purchaseId, purchaseId)).limit(1);
    return result[0];
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
    return result[0];
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(data).returning();
    return result[0];
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set(data)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await db.select()
      .from(invoices)
      .orderBy(invoices.createdAt)
      .limit(1);
    
    let sequence = 1;
    if (lastInvoice.length > 0) {
      const lastNumber = lastInvoice[0].invoiceNumber;
      const lastSequence = parseInt(lastNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }
    
    return `INV-${year}${month}-${String(sequence).padStart(6, '0')}`;
  }
}
