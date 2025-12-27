import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Email subscription statuses
export const emailStatusEnum = ["active", "unsubscribed", "bounced"] as const;
export type EmailStatus = (typeof emailStatusEnum)[number];

export const users = pgTable("users", {
  // Whop user ID as primary key
  whopUserId: varchar("whop_user_id", { length: 255 }).primaryKey(),

  // User information
  email: varchar("email", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }),
  name: varchar("name", { length: 255 }),

  // Email subscription status
  emailStatus: varchar("email_status", { length: 50 })
    .notNull()
    .default("active"), // 'active', 'unsubscribed', or 'bounced'

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"), // Track when they unsubscribed
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
