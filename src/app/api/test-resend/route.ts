import { NextResponse } from "next/server";
import { addToMailingList } from "@/lib/resend-client";
import { sendWelcomeEmail } from "@/lib/emails";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Please provide email as query param: ?email=test@example.com" },
      { status: 400 }
    );
  }

  console.log("🧪 Testing Resend with email:", email);

  // Test 1: Add to mailing list
  console.log("\n--- Test 1: Adding to mailing list ---");
  const contactResult = await addToMailingList({
    email,
    firstName: "Test",
    lastName: "User",
    source: "test-endpoint",
  });

  console.log("Contact result:", contactResult);

  // Wait 1 second to avoid rate limit (free tier: 2 req/sec)
  console.log("\n⏳ Waiting 1 second to avoid rate limit...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Send welcome email
  console.log("\n--- Test 2: Sending welcome email ---");
  const emailResult = await sendWelcomeEmail(email, "Test User");

  console.log("Email result:", emailResult);

  return NextResponse.json({
    success: true,
    results: {
      contact: contactResult,
      email: emailResult,
    },
    env: {
      hasApiKey: !!process.env.RESEND_API_KEY,
      hasAudienceId: !!process.env.RESEND_AUDIENCE_ID,
      apiKeyPreview: process.env.RESEND_API_KEY
        ? `${process.env.RESEND_API_KEY.substring(0, 6)}...`
        : "missing",
    },
  });
}
