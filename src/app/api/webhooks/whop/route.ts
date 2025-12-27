import { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { sendDiscord, createEmbed } from "@/lib/discord";
import { addToMailingList } from "@/lib/resend-client";
import {
  sendWelcomeEmail,
  sendCancellationEmail,
  sendRefundEmail,
  sendMembershipExpiredEmail,
} from "@/lib/emails";
import { storeUserEmail, getUserFromDatabase } from "@/lib/db/user-service";

export async function POST(request: NextRequest) {
  console.log("🔔 Whop webhook received");

  // Verify webhook authenticity via Whop SDK
  const raw = await request.text();
  const headers = Object.fromEntries(request.headers);

  let webhookData: any;
  try {
    webhookData = whopsdk.webhooks.unwrap(raw, { headers });
    console.log("✅ Webhook signature verified");
  } catch (err) {
    console.error("❌ Invalid Whop webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const type = webhookData.type as string;
  const data = webhookData.data;

  console.log(`📋 Processing webhook type: ${type}`);
  console.log(`🔍 Raw webhook data:`, JSON.stringify(data, null, 2));

  // Extract user and product information
  // Email can be in data.user.email (payment events) OR data.email (membership events)
  const username = data?.user?.username ?? "";
  const name = data?.user?.name ?? "";
  const email = data?.user?.email ?? data?.email ?? "";
  const product = data?.product?.title ?? "";

  console.log(`👤 User data:`, { username, name, email, product });

  // Split name into first/last if available
  const nameParts = name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Extract payment information
  const finalAmount = data?.final_amount;
  const subtotal = data?.subtotal;
  const currency = data?.currency?.toUpperCase() ?? "USD";

  // Format price for display
  const formatPrice = (amount: number | undefined) => {
    if (!amount) return "N/A";
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  // Route events to appropriate Discord channels
  if (type === "payment.succeeded") {
    const fields = [
      { name: "User", value: `${name} (@${username})`, inline: true },
      { name: "Product", value: product, inline: true },
    ];

    if (finalAmount) {
      fields.push({
        name: "Amount",
        value: formatPrice(finalAmount),
        inline: true,
      });

      if (subtotal !== finalAmount) {
        fields.push({
          name: "Subtotal",
          value: formatPrice(subtotal),
          inline: true,
        });
      }
    }

    await sendDiscord(
      process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
      createEmbed({
        title: "💰 Payment Succeeded",
        description: "A new payment has been successfully processed!",
        color: "success",
        fields,
      })
    );

    // Capture email for mailing list
    if (email) {
      // Store the user's email in database for future membership events (which don't include email)
      const userId = data?.user?.id;
      if (userId) {
        await storeUserEmail(userId, email, name, username);
      }

      await addToMailingList({
        email,
        firstName,
        lastName,
        source: "payment.succeeded",
      });

      // Small delay to avoid Resend rate limit
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Send welcome email (payment.succeeded has email data, membership.activated doesn't)
      await sendWelcomeEmail(email, name || username);
    }
  }

  if (type === "payment.failed") {
    await sendDiscord(
      process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
      createEmbed({
        title: "❌ Payment Failed",
        description: "A payment attempt has failed.",
        color: "error",
        fields: [
          { name: "User", value: `${name} (@${username})`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );

    // Capture email - they attempted but failed
    if (email) {
      // Store the user's email in database
      const userId = data?.user?.id;
      if (userId) {
        await storeUserEmail(userId, email, name, username);
      }

      await addToMailingList({
        email,
        firstName,
        lastName,
        source: "payment.failed",
      });
    }
  }

  if (type === "payment.pending") {
    await sendDiscord(
      process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
      createEmbed({
        title: "⏳ Payment Pending",
        description: "A payment is pending confirmation.",
        color: "pending",
        fields: [
          { name: "User", value: `${name} (@${username})`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );

    // Capture email - payment started but not completed
    if (email) {
      // Store the user's email in database
      const userId = data?.user?.id;
      if (userId) {
        await storeUserEmail(userId, email, name, username);
      }

      await addToMailingList({
        email,
        firstName,
        lastName,
        source: "payment.pending",
      });
    }
  }

  if (type === "membership.activated") {
    await sendDiscord(
      process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
      createEmbed({
        title: "✅ Membership Activated",
        description: "A new member has joined!",
        color: "success",
        fields: [
          { name: "User", value: `@${username}`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );

    // Note: membership.activated webhook doesn't include email data
    // Welcome email is sent on payment.succeeded instead
  }

  if (type === "membership.deactivated") {
    await sendDiscord(
      process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
      createEmbed({
        title: "⚠️ Membership Deactivated",
        description: "A membership has been deactivated.",
        color: "warning",
        fields: [
          { name: "User", value: `@${username}`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );

    // Membership events don't include email - get it from database
    const userId = data?.user?.id;

    if (userId) {
      const user = await getUserFromDatabase(userId);
      if (user) {
        // IMPORTANT: Keep email - win them back!
        await addToMailingList({
          email: user.email,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          source: "membership.deactivated",
        });

        // Small delay to avoid Resend rate limit
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Send cancellation email
        await sendCancellationEmail(
          user.email,
          user.name || user.username || ""
        );
      }
    }
  }

  if (type === "payment.refunded") {
    const refundAmount = data?.refunded_amount ?? data?.final_amount;

    await sendDiscord(
      process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
      createEmbed({
        title: "💸 Payment Refunded",
        description: "A payment has been refunded.",
        color: "warning",
        fields: [
          { name: "User", value: `${name} (@${username})`, inline: true },
          { name: "Product", value: product, inline: true },
          {
            name: "Refund Amount",
            value: formatPrice(refundAmount),
            inline: true,
          },
        ],
      })
    );

    // Keep email - they may come back
    if (email) {
      // Store the user's email in database
      const userId = data?.user?.id;
      if (userId) {
        await storeUserEmail(userId, email, name, username);
      }

      await addToMailingList({
        email,
        firstName,
        lastName,
        source: "payment.refunded",
      });

      // Small delay to avoid Resend rate limit
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Send refund confirmation email
      await sendRefundEmail(email, name, formatPrice(refundAmount));
    }
  }

  if (type === "membership.went_valid") {
    await sendDiscord(
      process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
      createEmbed({
        title: "🎉 Membership Went Valid",
        description: "A trial has ended and membership is now active!",
        color: "success",
        fields: [
          { name: "User", value: `@${username}`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );
  }

  if (type === "membership.went_invalid") {
    await sendDiscord(
      process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
      createEmbed({
        title: "❗ Membership Went Invalid",
        description: "A membership has expired or been cancelled.",
        color: "error",
        fields: [
          { name: "User", value: `@${username}`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );

    // Membership events don't include email - get it from database
    const userId = data?.user?.id;
    if (userId) {
      const user = await getUserFromDatabase(userId);
      if (user) {
        // Add to mailing list
        await addToMailingList({
          email: user.email,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          source: "membership.went_invalid",
        });

        // Small delay to avoid rate limit
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Send membership expired email
        await sendMembershipExpiredEmail(
          user.email,
          user.name || user.username || ""
        );
      }
    }
  }

  if (type === "payment.account_on_hold") {
    await sendDiscord(
      process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
      createEmbed({
        title: "⚠️ Account On Hold",
        description:
          "Payment method has failed repeatedly. Member needs to update payment.",
        color: "warning",
        fields: [
          { name: "User", value: `${name} (@${username})`, inline: true },
          { name: "Product", value: product, inline: true },
        ],
      })
    );
  }

  if (type === "membership.cancelled") {
    const cancelReason = data?.cancellation_reason ?? "Not specified";

    await sendDiscord(
      process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
      createEmbed({
        title: "🚫 Membership Cancelled",
        description: "A member has cancelled their subscription.",
        color: "warning",
        fields: [
          { name: "User", value: `@${username}`, inline: true },
          { name: "Product", value: product, inline: true },
          { name: "Reason", value: cancelReason, inline: false },
        ],
      })
    );

    // Membership events don't include email - get it from database
    const userId = data?.user?.id;
    if (userId) {
      const user = await getUserFromDatabase(userId);
      if (user) {
        // IMPORTANT: Keep email - win them back!
        await addToMailingList({
          email: user.email,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          source: "membership.cancelled",
        });

        // Small delay to avoid Resend rate limit
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Send cancellation email
        await sendCancellationEmail(
          user.email,
          user.name || user.username || ""
        );
      }
    }
  }

  // Return 200 quickly to prevent Whop retries
  return new Response("OK", { status: 200 });
}
