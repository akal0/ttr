import { NextResponse } from "next/server";
import {
  getAbandonedCheckouts,
  cleanupOldSessions,
} from "@/lib/checkout-tracker";
import { sendDiscord, createEmbed } from "@/lib/discord";

export async function GET(req: Request) {
  // Optional: Add authentication to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get abandoned checkouts
    const abandoned = getAbandonedCheckouts();

    if (abandoned.length > 0) {
      // Notify via Discord
      await sendDiscord(
        process.env.DISCORD_INITIATE_WEBHOOK_URL!,
        createEmbed({
          title: "🛒 Abandoned checkouts detected",
          description: `${abandoned.length} checkout(s) abandoned in the last 30 minutes`,
          color: "warning",
        })
      );

      console.log(`Found ${abandoned.length} abandoned checkouts`);
    }

    // Clean up old sessions
    cleanupOldSessions();

    return NextResponse.json({
      success: true,
      abandonedCount: abandoned.length,
    });
  } catch (error) {
    console.error("Error checking abandoned checkouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
