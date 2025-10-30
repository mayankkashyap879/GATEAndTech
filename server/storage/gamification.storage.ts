import { db } from "../db";
import { 
  userPoints, 
  badges, 
  userBadges,
  type UserPoints,
  type InsertUserPoints,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export class GamificationStorage {
  async getUserPoints(userId: string): Promise<UserPoints | undefined> {
    const result = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
    return result[0];
  }

  async createUserPoints(data: InsertUserPoints): Promise<UserPoints> {
    const result = await db.insert(userPoints).values(data).returning();
    return result[0];
  }

  async updateUserPoints(userId: string, data: Partial<InsertUserPoints>): Promise<UserPoints | undefined> {
    const result = await db.update(userPoints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userPoints.userId, userId))
      .returning();
    return result[0];
  }

  async incrementUserPoints(userId: string, points: number): Promise<UserPoints | undefined> {
    const current = await this.getUserPoints(userId);
    if (!current) {
      return this.createUserPoints({ userId, points, streak: 0 });
    }
    return this.updateUserPoints(userId, { points: current.points + points });
  }

  async updateStreak(userId: string, streak: number): Promise<UserPoints | undefined> {
    return this.updateUserPoints(userId, { streak, lastLoginAt: new Date() });
  }

  async getLeaderboard(limit: number = 10): Promise<UserPoints[]> {
    return db.select().from(userPoints).orderBy(desc(userPoints.points)).limit(limit);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return result[0];
  }

  async getBadgeBySlug(slug: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.slug, slug)).limit(1);
    return result[0];
  }

  async getAllBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async createBadge(data: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values(data).returning();
    return result[0];
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async awardBadge(data: InsertUserBadge): Promise<UserBadge> {
    const result = await db.insert(userBadges).values(data).returning();
    return result[0];
  }

  async hasUserBadge(userId: string, badgeId: string): Promise<boolean> {
    const result = await db.select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);
    return result.length > 0;
  }
}
