/**
 * Simple in-memory cache to store user emails
 * In production, this should be replaced with a database (Postgres, Redis, etc.)
 */

interface UserData {
  email: string;
  name: string;
  username: string;
  lastUpdated: number;
}

// In-memory cache: userId -> UserData
const userCache = new Map<string, UserData>();

export function cacheUserEmail(
  userId: string,
  email: string,
  name: string,
  username: string
) {
  if (!userId || !email) return;

  userCache.set(userId, {
    email,
    name,
    username,
    lastUpdated: Date.now(),
  });

  console.log(`💾 Cached email for user ${userId}: ${email}`);
}

export function getCachedUserEmail(userId: string): string | null {
  if (!userId) return null;

  const userData = userCache.get(userId);

  if (userData) {
    console.log(`✅ Found cached email for user ${userId}: ${userData.email}`);
    return userData.email;
  }

  console.log(`❌ No cached email found for user ${userId}`);
  return null;
}

export function getCachedUserData(userId: string): UserData | null {
  if (!userId) return null;

  const userData = userCache.get(userId);

  if (userData) {
    console.log(`✅ Found cached data for user ${userId}:`, userData);
    return userData;
  }

  console.log(`❌ No cached data found for user ${userId}`);
  return null;
}

// Clean up old cache entries (older than 90 days)
export function cleanupCache() {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let cleanedCount = 0;

  for (const [userId, userData] of userCache.entries()) {
    if (userData.lastUpdated < ninetyDaysAgo) {
      userCache.delete(userId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} old cache entries`);
  }
}
