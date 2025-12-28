import { Whop } from "@whop/sdk";

export const whopsdk = new Whop({
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
});

/**
 * Fetch user email from Whop API when webhook doesn't include it
 * (membership events don't include email, only payment events do)
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  if (!userId) return null;

  try {
    console.log(`📞 Fetching user email from Whop API for user: ${userId}`);

    // Use Whop SDK to fetch user details
    const user = await whopsdk.users.retrieve(userId);

    console.log(`🔍 Full user object from API:`, JSON.stringify(user, null, 2));

    // Type assertion since SDK types may not be complete
    const email = (user as any).email || null;
    console.log(`✅ Retrieved user email: ${email || "not found"}`);

    return email;
  } catch (error) {
    console.error(`❌ Failed to fetch user email for ${userId}:`, error);
    return null;
  }
}
