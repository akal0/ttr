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

  // ✅ Extract Aurea anonymous ID from checkout session metadata
  // This is the SAME anonymousId from the user's browsing session
  // Passed via buy-button: checkout_session_metadata[aurea_anonymous_id]
  const aureaAnonymousId =
    data?.checkout_session?.metadata?.aurea_anonymous_id ||
    data?.metadata?.aurea_anonymous_id ||
    data?.metadata?.aurea_id ||
    data?.checkout_session?.metadata?.aurea_id;

  const aureaSessionId =
    data?.checkout_session?.metadata?.aurea_session_id ||
    data?.metadata?.aurea_session_id;

  const checkoutStartedAt =
    data?.checkout_session?.metadata?.checkout_started_at ||
    data?.metadata?.checkout_started_at;

  console.log(
    `🔗 Aurea tracking - anonymousId: ${
      aureaAnonymousId || "not found"
    }, sessionId: ${aureaSessionId || "not found"}`
  );

  // Helper function to track events in Aurea
  const trackAureaEvent = async (
    eventName: string,
    properties: Record<string, any>
  ) => {
    const userId = data?.user?.id;
    if (!userId) return;

    // ✅ Use the SAME anonymousId from the browsing session (critical for session linking)
    const anonymousIdToUse = aureaAnonymousId || userId;

    // ✅ Use the SAME sessionId from the browsing session (critical for session continuity)
    const sessionIdToUse = aureaSessionId || aureaAnonymousId || userId;

    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_AUREA_API_URL || "http://localhost:3000/api"
        }/track/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Aurea-API-Key": process.env.NEXT_PUBLIC_AUREA_API_KEY || "",
            "X-Aurea-Funnel-ID": process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID || "",
          },
          body: JSON.stringify({
            events: [
              {
                eventId: `evt_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                eventName,
                properties: {
                  ...properties,
                  product: product || "TTR Membership",
                  username,
                  email,
                },
                context: {
                  user: {
                    userId: email || undefined, // Use email as userId for consistency
                    anonymousId: anonymousIdToUse, // ✅ SAME anonymousId from browsing session
                  },
                  session: {
                    sessionId: sessionIdToUse, // ✅ SAME sessionId from browsing session
                  },
                },
                timestamp: Date.now(),
              },
            ],
            batch: true,
          }),
        }
      );
      console.log(
        `✅ Tracked ${eventName} in Aurea with anonymousId: ${anonymousIdToUse}, sessionId: ${sessionIdToUse}`
      );
    } catch (error) {
      console.error(`Failed to track ${eventName} in Aurea:`, error);
    }
  };

  // Helper function to identify user in Aurea (link anonymous → known user)
  const identifyAureaUser = async () => {
    if (!email || !aureaAnonymousId) {
      console.log(
        `⏭️  Skipping Aurea identify: email=${!!email}, anonymousId=${!!aureaAnonymousId}`
      );
      return;
    }

    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_AUREA_API_URL || "http://localhost:3000/api"
        }/track/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Aurea-API-Key": process.env.NEXT_PUBLIC_AUREA_API_KEY || "",
            "X-Aurea-Funnel-ID": process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID || "",
          },
          body: JSON.stringify({
            events: [
              {
                eventId: `evt_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                eventName: "user_identified",
                properties: {
                  userId: email,
                  anonymousId: aureaAnonymousId,
                  traits: {
                    name: name || username || "Unknown",
                    email: email,
                    username: username || "",
                    product: product || "TTR Membership",
                    whopUserId: data?.user?.id || "",
                  },
                  timestamp: Date.now(),
                },
                context: {
                  user: {
                    userId: email,
                    anonymousId: aureaAnonymousId,
                  },
                  session: {
                    sessionId: aureaAnonymousId,
                  },
                },
                timestamp: Date.now(),
              },
            ],
            batch: true,
          }),
        }
      );
      console.log(
        `✅ Identified user in Aurea: ${email} (anonymousId: ${aureaAnonymousId})`
      );
    } catch (error) {
      console.error("Failed to identify user in Aurea:", error);
    }
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
        title: "💰 Payment succeeded",
        description: "A new payment has been successfully processed!",
        color: "success",
        fields,
      })
    );

    // Identify the user in Aurea (link anonymous → known user)
    await identifyAureaUser();

    // ✅ UPDATED: Track conversion with checkout duration and session bridging
    const revenueAmount = finalAmount || subtotal || 9900; // Fallback to $99 if no amount

    // Get original session ID from metadata (passed from checkout initiation)
    const originalSessionId =
      data?.metadata?.session_id ||
      data?.checkout_session?.metadata?.session_id;

    // Calculate checkout duration from webhook metadata if available
    const aureaCheckoutStartTime = data?.metadata?.checkout_started_at;
    const checkoutDuration = aureaCheckoutStartTime
      ? Math.floor(
          (Date.now() - Number.parseInt(aureaCheckoutStartTime, 10)) / 1000
        )
      : null;

    // ✅ Track conversion AND end the session
    // This marks the session as completed with a successful purchase
    await trackAureaEvent("checkout_completed", {
      conversionType: "purchase",
      revenue: revenueAmount / 100, // Convert cents to dollars
      currency: currency || "USD",
      orderId: data?.id || "",
      checkoutDuration, // Time spent in checkout flow
      originalSessionId, // Link back to browsing session
      source: "whop_webhook",
      sessionEnd: true, // ✅ Signal to end the session
    });

    // ✅ Track session_end event to properly close the session
    await trackAureaEvent("session_end", {
      converted: true,
      conversionType: "purchase",
      revenue: revenueAmount / 100,
      orderId: data?.id || "",
      duration: checkoutDuration || 0,
      source: "whop_webhook",
    });

    // Mark user as purchased so client-side can detect and redirect
    // if (aureaAnonymousId) {
    //   try {
    //     await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/check-purchase`, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         anonymousId: aureaAnonymousId,
    //         secret: process.env.PURCHASE_CHECK_SECRET || "dev-secret-123",
    //       }),
    //     });
    //     console.log(`✅ Marked user ${aureaAnonymousId} for redirect to thank-you page`);
    //   } catch (error) {
    //     console.error("Failed to mark purchase for redirect:", error);
    //   }
    // }

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

    // Track failed payment in Aurea
    const attemptedAmount = finalAmount || subtotal || 9900;
    await trackAureaEvent("payment_failed", {
      attemptedRevenue: attemptedAmount / 100,
      currency: currency || "USD",
      failureReason: data?.failure_reason || "unknown",
    });

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

    // Track pending payment in Aurea
    const pendingAmount = finalAmount || subtotal || 9900;
    await trackAureaEvent("payment_pending", {
      pendingRevenue: pendingAmount / 100,
      currency: currency || "USD",
      paymentMethod: data?.payment_method || "unknown",
    });

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

    // Track membership deactivation in Aurea
    await trackAureaEvent("membership_deactivated", {
      deactivationReason: data?.deactivation_reason || "unknown",
    });

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

    // Track refund in Aurea
    await trackAureaEvent("payment_refunded", {
      refundAmount: (refundAmount || 0) / 100,
      currency: currency || "USD",
      refundReason: data?.refund_reason || "unknown",
      orderId: data?.id || "",
    });

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

    // Track cancellation in Aurea
    await trackAureaEvent("membership_cancelled", {
      cancellationReason: cancelReason,
      cancelledAt: new Date().toISOString(),
    });

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
