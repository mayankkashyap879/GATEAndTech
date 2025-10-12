import {
  users,
  sessions,
  verificationTokens,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type VerificationToken,
} from "@shared/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";

export class UserStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertOAuthUser(data: {
    email: string;
    name: string;
    authProvider: "google" | "github";
    providerId: string;
    avatar?: string;
  }): Promise<User> {
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.authProvider, data.authProvider),
          eq(users.providerId, data.providerId)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      const [user] = await db
        .update(users)
        .set({
          name: data.name,
          avatar: data.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      return user;
    }

    const userByEmail = await this.getUserByEmail(data.email);
    if (userByEmail) {
      const [user] = await db
        .update(users)
        .set({
          authProvider: data.authProvider,
          providerId: data.providerId,
          avatar: data.avatar || userByEmail.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userByEmail.id))
        .returning();
      return user;
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        authProvider: data.authProvider,
        providerId: data.providerId,
        avatar: data.avatar,
        role: "student",
        theme: "system",
        twofaEnabled: false,
      })
      .returning();
    return newUser;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<VerificationToken> {
    const [resetToken] = await db
      .insert(verificationTokens)
      .values({
        userId,
        token,
        type: 'password_reset',
        expiresAt,
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<VerificationToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, 'password_reset')
        )
      );
    return resetToken || undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, 'password_reset')
        )
      );
  }

  async deleteUserPasswordResetTokens(userId: string): Promise<void> {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, 'password_reset')
        )
      );
  }
}
