import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔍 Checking for abandoned checkouts...");
    
    // Find checkout sessions started >30 min ago with no completion
    const abandonedCheckouts = await findAbandonedCheckouts();
    
    console.log(`Found ${abandonedCheckouts.length} abandoned checkouts`);
    
    for (const session of abandonedCheckouts) {
      try {
        // Send checkout_abandoned event to Aurea
        await fetch(`${process.env.NEXT_PUBLIC_AUREA_API_URL || 'http://localhost:3000/api'}/track/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Aurea-API-Key": process.env.NEXT_PUBLIC_AUREA_API_KEY || "",
            "X-Aurea-Funnel-ID": process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID || "",
          },
          body: JSON.stringify({
            events: [{
              eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              eventName: "checkout_abandoned",
              properties: {
                reason: "timeout_30min",
                checkoutStartedAt: session.checkoutStartedAt,
                abandonedAt: new Date().toISOString(),
                anonymousId: session.anonymousId,
              },
              context: {
                user: {
                  anonymousId: session.anonymousId,
                },
                session: {
                  sessionId: session.sessionId,
                },
              },
              timestamp: Date.now(),
            }],
            batch: true,
          }),
        });
        
        console.log(`✅ Marked checkout as abandoned: ${session.sessionId}`);
      } catch (error) {
        console.error(`❌ Failed to mark checkout as abandoned: ${session.sessionId}`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      abandoned: abandonedCheckouts.length,
      message: `Processed ${abandonedCheckouts.length} abandoned checkouts`
    });
  } catch (error) {
    console.error("❌ Error checking abandoned checkouts:", error);
    return NextResponse.json({ 
      error: "Internal error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * Find checkout sessions that were started >30 minutes ago
 * but have not been completed (no purchase)
 */
async function findAbandonedCheckouts() {
  try {
    // Import the checkout sessions storage
    const { getAllCheckoutSessions } = await import("@/app/api/checkout/init/route");
    const sessions = getAllCheckoutSessions();
    
    const thirtyMinAgo = Date.now() - (30 * 60 * 1000);
    
    // Filter sessions that are older than 30 minutes
    const abandoned = sessions
      .filter(([_, session]) => session.timestamp < thirtyMinAgo)
      .map(([anonymousId, session]) => ({
        sessionId: anonymousId,
        anonymousId,
        checkoutStartedAt: new Date(session.timestamp).toISOString(),
      }));
    
    return abandoned;
  } catch (error) {
    console.error("Error fetching checkout sessions:", error);
    return [];
  }
}
