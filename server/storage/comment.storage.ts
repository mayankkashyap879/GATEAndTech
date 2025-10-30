import { db } from "../db";
import { 
  comments,
  commentVotes,
  flags,
  type Comment,
  type InsertComment,
  type CommentVote,
  type InsertCommentVote,
  type Flag,
  type InsertFlag
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export class CommentStorage {
  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async getQuestionComments(questionId: string): Promise<Comment[]> {
    return db.select()
      .from(comments)
      .where(eq(comments.questionId, questionId))
      .orderBy(asc(comments.createdAt));
  }

  async getCommentReplies(parentCommentId: string): Promise<Comment[]> {
    return db.select()
      .from(comments)
      .where(eq(comments.parentCommentId, parentCommentId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(data: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(data).returning();
    return result[0];
  }

  async updateComment(id: string, data: Partial<InsertComment>): Promise<Comment | undefined> {
    const result = await db.update(comments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    await db.update(comments)
      .set({ status: 'deleted' })
      .where(eq(comments.id, id));
  }

  async incrementUpvotes(id: string): Promise<Comment | undefined> {
    const comment = await this.getComment(id);
    if (!comment) return undefined;
    
    const result = await db.update(comments)
      .set({ upvotes: comment.upvotes + 1 })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async decrementUpvotes(id: string): Promise<Comment | undefined> {
    const comment = await this.getComment(id);
    if (!comment) return undefined;
    
    const result = await db.update(comments)
      .set({ upvotes: Math.max(0, comment.upvotes - 1) })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async getUserVote(commentId: string, voterId: string): Promise<CommentVote | undefined> {
    const result = await db.select()
      .from(commentVotes)
      .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voterId, voterId)))
      .limit(1);
    return result[0];
  }

  async createVote(data: InsertCommentVote): Promise<CommentVote> {
    const result = await db.insert(commentVotes).values(data).returning();
    return result[0];
  }

  async deleteVote(commentId: string, voterId: string): Promise<void> {
    await db.delete(commentVotes)
      .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voterId, voterId)));
  }

  async createFlag(data: InsertFlag): Promise<Flag> {
    const result = await db.insert(flags).values(data).returning();
    return result[0];
  }

  async getFlags(filters?: { status?: string }): Promise<Flag[]> {
    if (filters?.status) {
      return db.select().from(flags).where(eq(flags.status, filters.status)).orderBy(desc(flags.createdAt));
    }
    return db.select().from(flags).orderBy(desc(flags.createdAt));
  }

  async updateFlag(id: string, status: string): Promise<Flag | undefined> {
    const result = await db.update(flags)
      .set({ status })
      .where(eq(flags.id, id))
      .returning();
    return result[0];
  }

  async getCommentFlags(commentId: string): Promise<Flag[]> {
    return db.select().from(flags).where(eq(flags.commentId, commentId));
  }
}
