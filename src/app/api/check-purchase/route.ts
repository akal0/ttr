import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// In-memory store for recent purchases (maps anonymousId -> timestamp)
// In production, you'd use Redis or a database
const recentPurchases = new Map<string, number>();

// Clean up old entries (older than 1 hour)
function cleanupOldPurchases() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, timestamp] of recentPurchases.entries()) {
    if (timestamp < oneHourAgo) {
      recentPurchases.delete(id);
    }
  }
}

/**
 * Check if a user (by anonymousId) has recently made a purchase
 * Called by client-side polling
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const anonymousId = searchParams.get("anonymousId");

  if (!anonymousId) {
    return NextResponse.json({ hasPurchased: false });
  }

  cleanupOldPurchases();

  const hasPurchased = recentPurchases.has(anonymousId);
  
  // If found, remove it (one-time check)
  if (hasPurchased) {
    recentPurchases.delete(anonymousId);
  }

  return NextResponse.json({ hasPurchased });
}

/**
 * Mark a user as having purchased (called by webhook)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId, secret } = body;

    // Simple secret to prevent abuse
    if (secret !== process.env.PURCHASE_CHECK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!anonymousId) {
      return NextResponse.json({ error: "Missing anonymousId" }, { status: 400 });
    }

    // Mark this user as having purchased
    recentPurchases.set(anonymousId, Date.now());
    console.log(`✅ Marked ${anonymousId} as purchased`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking purchase:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
