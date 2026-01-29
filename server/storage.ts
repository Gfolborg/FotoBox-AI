import { db } from "./db";
import { users, subscriptions, usageHistory } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  createUser(username: string, password: string): Promise<typeof users.$inferSelect>;
  getUserByUsername(username: string): Promise<typeof users.$inferSelect | undefined>;
  getUserById(id: string): Promise<typeof users.$inferSelect | undefined>;
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
  getSubscription(userId: string): Promise<typeof subscriptions.$inferSelect | undefined>;
  createSubscription(userId: string): Promise<typeof subscriptions.$inferSelect>;
  updateSubscription(userId: string, data: Partial<typeof subscriptions.$inferInsert>): Promise<typeof subscriptions.$inferSelect | undefined>;
  useCredit(userId: string, action: string): Promise<{ success: boolean; creditsRemaining: number; message?: string }>;
  getUsageHistory(userId: string): Promise<(typeof usageHistory.$inferSelect)[]>;
}

export class DatabaseStorage implements IStorage {
  async createUser(username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      username,
      password: hashedPassword,
    }).returning();
    
    await this.createSubscription(user.id);
    
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async validatePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }

  async getSubscription(userId: string) {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(userId: string) {
    const [subscription] = await db.insert(subscriptions).values({
      userId,
      plan: "free",
      status: "active",
      creditsRemaining: 3,
      creditsTotal: 3,
    }).returning();
    return subscription;
  }

  async updateSubscription(userId: string, data: Partial<typeof subscriptions.$inferInsert>) {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return updated;
  }

  async useCredit(userId: string, action: string) {
    const subscription = await this.getSubscription(userId);
    
    if (!subscription) {
      return { success: false, creditsRemaining: 0, message: "No subscription found" };
    }

    if (subscription.plan === "unlimited" || subscription.plan === "pro") {
      const now = new Date();
      if (!subscription.expiresAt || subscription.expiresAt > now) {
        await db.insert(usageHistory).values({
          userId,
          action,
          creditsUsed: 0,
        });
        return { success: true, creditsRemaining: -1 };
      }
    }

    if (subscription.creditsRemaining <= 0) {
      return { success: false, creditsRemaining: 0, message: "No credits remaining" };
    }

    const newCredits = subscription.creditsRemaining - 1;
    
    await db
      .update(subscriptions)
      .set({ creditsRemaining: newCredits, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));

    await db.insert(usageHistory).values({
      userId,
      action,
      creditsUsed: 1,
    });

    return { success: true, creditsRemaining: newCredits };
  }

  async getUsageHistory(userId: string) {
    const history = await db
      .select()
      .from(usageHistory)
      .where(eq(usageHistory.userId, userId))
      .orderBy(usageHistory.createdAt);
    return history;
  }
}

export const storage = new DatabaseStorage();
