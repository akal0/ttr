import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Count only active email subscribers
    // Users with 'active' email status are current members
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.emailStatus, "active"));

    const memberCount = result[0]?.count || 0;

    return NextResponse.json({ count: memberCount });
  } catch (error) {
    console.error("Failed to fetch member count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
