import { db } from "../db";
import { 
  coupons,
  type Coupon,
  type InsertCoupon
} from "@shared/schema";
import { eq, and, gt, or, isNull } from "drizzle-orm";

export class CouponStorage {
  async getCoupon(id: string): Promise<Coupon | undefined> {
    const result = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return result[0];
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const result = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    return result[0];
  }

  async getAllCoupons(filters?: { isActive?: boolean }): Promise<Coupon[]> {
    if (filters?.isActive !== undefined) {
      return db.select().from(coupons).where(eq(coupons.isActive, filters.isActive));
    }
    return db.select().from(coupons);
  }

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    const result = await db.insert(coupons).values(data).returning();
    return result[0];
  }

  async updateCoupon(id: string, data: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const result = await db.update(coupons)
      .set(data)
      .where(eq(coupons.id, id))
      .returning();
    return result[0];
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async incrementUsageCount(id: string): Promise<Coupon | undefined> {
    const coupon = await this.getCoupon(id);
    if (!coupon) return undefined;
    
    const result = await db.update(coupons)
      .set({ usedCount: coupon.usedCount + 1 })
      .where(eq(coupons.id, id))
      .returning();
    return result[0];
  }

  async validateCoupon(code: string, testSeriesId?: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    const coupon = await this.getCouponByCode(code);
    
    if (!coupon) {
      return { valid: false, error: "Coupon not found" };
    }

    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is inactive" };
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return { valid: false, error: "Coupon has expired" };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }

    if (coupon.applicableTestSeriesId && testSeriesId && coupon.applicableTestSeriesId !== testSeriesId) {
      return { valid: false, error: "Coupon not applicable to this test series" };
    }

    return { valid: true, coupon };
  }
}
