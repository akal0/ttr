import { NextRequest, NextResponse } from "next/server";
import { unsubscribeUser, getUserByEmail } from "@/lib/db/user-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribe - Tom's Trading Room</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">Invalid Request</h1>
          <p>No email address provided.</p>
        </body>
      </html>
    `,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  console.log(`🔕 Unsubscribe request for: ${email}`);

  // Check if user exists
  const user = await getUserByEmail(email);

  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribe - Tom's Trading Room</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">User Not Found</h1>
          <p>We couldn't find this email address in our system.</p>
        </body>
      </html>
    `,
      {
        status: 404,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // Check if already unsubscribed
  if (user.emailStatus === "unsubscribed") {
    console.log(`ℹ️ User already unsubscribed: ${email}`);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Already Unsubscribed - Tom's Trading Room</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #3b82f6; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Already Unsubscribed</h1>
          <p>You're already unsubscribed from our emails.</p>
          <p>If you'd like to rejoin, visit:</p>
          <a href="${process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL}" class="button">Rejoin Tom's Trading Room</a>
        </body>
      </html>
    `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // Unsubscribe the user
  const success = await unsubscribeUser(email);

  if (!success) {
    console.error(`❌ Failed to unsubscribe: ${email}`);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Tom's Trading Room</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">Error</h1>
          <p>Something went wrong. Please try again later or contact support.</p>
        </body>
      </html>
    `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  console.log(`✅ User unsubscribed successfully: ${email}`);

  // Success page
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Unsubscribed - Tom's Trading Room</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          h1 { color: #10b981; }
          p { line-height: 1.6; color: #333; }
          .feedback {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>✓ You've Been Unsubscribed</h1>
        <p>You won't receive any more emails from Tom's Trading Room.</p>

        <div class="feedback">
          <p><strong>We're sorry to see you go!</strong></p>
          <p>If you change your mind, you can always rejoin our community:</p>
          <a href="${process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL}" class="button">Rejoin Tom's Trading Room</a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Unsubscribed: ${email}<br>
          Date: ${new Date().toLocaleDateString()}
        </p>
      </body>
    </html>
  `,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
