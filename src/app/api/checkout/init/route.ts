import { NextRequest, NextResponse } from "next/server";

// In-memory storage (in production, use Redis or database)
const checkoutSessions = new Map<string, { anonymousId: string; timestamp: number }>();

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, value] of checkoutSessions.entries()) {
    if (value.timestamp < oneHourAgo) {
      checkoutSessions.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId } = body;

    if (!anonymousId) {
      return NextResponse.json(
        { error: "anonymousId is required" },
        { status: 400 }
      );
    }

    // Store the anonymous ID with timestamp
    checkoutSessions.set(anonymousId, {
      anonymousId,
      timestamp: Date.now(),
    });

    console.log(`✅ Stored checkout session for anonymousId: ${anonymousId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export function to retrieve anonymousId (used by webhook)
export function getAnonymousIdFromCheckout(lookupKey: string): string | null {
  // Try exact match first
  const session = checkoutSessions.get(lookupKey);
  if (session) {
    return session.anonymousId;
  }

  // If not found, return null
  return null;
}

// Export function to get all sessions (for debugging)
export function getAllCheckoutSessions() {
  return Array.from(checkoutSessions.entries());
}
