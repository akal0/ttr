import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, type User, type EmailStatus } from "./schema";

/**
 * Store or update user email in the database
 * Called when we receive payment events that include email data
 */
export async function storeUserEmail(
  whopUserId: string,
  email: string,
  username: string,
  name: string
): Promise<void> {
  if (!whopUserId || !email) {
    console.warn("Missing whopUserId or email, cannot store");
    return;
  }

  try {
    console.log(`💾 Storing user in database: ${whopUserId} (${email})`);

    // Use upsert: insert if new, update if exists
    await db
      .insert(users)
      .values({
        whopUserId,
        email,
        username: username || null,
        name: name || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.whopUserId,
        set: {
          email,
          username: username || null,
          name: name || null,
          updatedAt: new Date(),
        },
      });

    console.log(`✅ User stored successfully: ${email}`);
  } catch (error) {
    console.error(`❌ Failed to store user ${whopUserId}:`, error);
  }
}

/**
 * Retrieve user data from the database
 * Called when we receive membership events that don't include email
 */
export async function getUserFromDatabase(
  whopUserId: string
): Promise<User | null> {
  if (!whopUserId) {
    console.warn("Missing whopUserId, cannot retrieve user");
    return null;
  }

  try {
    console.log(`🔍 Fetching user from database: ${whopUserId}`);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.whopUserId, whopUserId))
      .limit(1);

    if (result.length === 0) {
      console.log(`❌ User not found in database: ${whopUserId}`);
      return null;
    }

    const user = result[0];
    console.log(`✅ User found in database: ${user.email}`);
    return user;
  } catch (error) {
    console.error(`❌ Failed to retrieve user ${whopUserId}:`, error);
    return null;
  }
}

/**
 * Get user by email (for unsubscribe functionality)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email) {
    console.warn("Missing email, cannot retrieve user");
    return null;
  }

  try {
    console.log(`🔍 Fetching user by email: ${email}`);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      return null;
    }

    const user = result[0];
    console.log(`✅ User found by email: ${user.email}`);
    return user;
  } catch (error) {
    console.error(`❌ Failed to retrieve user by email ${email}:`, error);
    return null;
  }
}

/**
 * Update user's email subscription status
 */
export async function updateEmailStatus(
  email: string,
  status: EmailStatus
): Promise<boolean> {
  if (!email || !status) {
    console.warn("Missing email or status");
    return false;
  }

  try {
    console.log(`📧 Updating email status for ${email} to: ${status}`);

    const updateData: any = {
      emailStatus: status,
      updatedAt: new Date(),
    };

    // Set unsubscribedAt timestamp if unsubscribing
    if (status === "unsubscribed") {
      updateData.unsubscribedAt = new Date();
    }

    await db.update(users).set(updateData).where(eq(users.email, email));

    console.log(`✅ Email status updated successfully for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update email status for ${email}:`, error);
    return false;
  }
}

/**
 * Mark user as unsubscribed
 */
export async function unsubscribeUser(email: string): Promise<boolean> {
  return updateEmailStatus(email, "unsubscribed");
}

/**
 * Mark user as bounced (for webhook handling)
 */
export async function markUserBounced(email: string): Promise<boolean> {
  return updateEmailStatus(email, "bounced");
}

/**
 * Resubscribe user (set back to active)
 */
export async function resubscribeUser(email: string): Promise<boolean> {
  return updateEmailStatus(email, "active");
}
