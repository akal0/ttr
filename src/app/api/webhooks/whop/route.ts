import type { NextRequest } from "next/server";
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

// Aurea API configuration
const AUREA_API_URL = process.env.NEXT_PUBLIC_AUREA_API_URL || "http://localhost:3000/api";
const AUREA_API_KEY = process.env.NEXT_PUBLIC_AUREA_API_KEY || "";
const AUREA_FUNNEL_ID = process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID || "";

/**
 * Send tracking event to Aurea CRM
 */
async function trackAureaEvent(
  eventName: string,
  properties: Record<string, unknown>,
  context: {
    anonymousId: string;
    sessionId: string;
    userId?: string;
  }
) {
  try {
    const response = await fetch(`${AUREA_API_URL}/track/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurea-API-Key": AUREA_API_KEY,
        "X-Aurea-Funnel-ID": AUREA_FUNNEL_ID,
      },
      body: JSON.stringify({
        events: [
          {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            eventName,
            properties,
            context: {
              user: {
                userId: context.userId,
                anonymousId: context.anonymousId,
              },
              session: {
                sessionId: context.sessionId,
              },
            },
            timestamp: Date.now(),
          },
        ],
        batch: true,
      }),
    });
    
    if (!response.ok) {
      console.error(`[Aurea] Failed to track ${eventName}:`, await response.text());
    } else {
      console.log(`[Aurea] Tracked ${eventName} for session ${context.sessionId}`);
    }
  } catch (error) {
    console.error(`[Aurea] Error tracking ${eventName}:`, error);
  }
}

/**
 * Identify user in Aurea CRM (link anonymous to known user)
 */
async function identifyAureaUser(
  email: string,
  anonymousId: string,
  traits: Record<string, unknown>
) {
  try {
    const response = await fetch(`${AUREA_API_URL}/track/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurea-API-Key": AUREA_API_KEY,
        "X-Aurea-Funnel-ID": AUREA_FUNNEL_ID,
      },
      body: JSON.stringify({
        events: [
          {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            eventName: "user_identified",
            properties: {
              userId: email,
              anonymousId,
              traits,
            },
            context: {
              user: {
                userId: email,
                anonymousId,
              },
              session: {
                sessionId: anonymousId,
              },
            },
            timestamp: Date.now(),
          },
        ],
        batch: true,
      }),
    });
    
    if (!response.ok) {
      console.error("[Aurea] Failed to identify user:", await response.text());
    } else {
      console.log(`[Aurea] Identified user ${email} (anonymous: ${anonymousId})`);
    }
  } catch (error) {
    console.error("[Aurea] Error identifying user:", error);
  }
}

export async function POST(request: NextRequest) {
  console.log("Whop webhook received");

  // Verify webhook authenticity via Whop SDK
  const raw = await request.text();
  const headers = Object.fromEntries(request.headers);

  let webhookData: { type: string; data: Record<string, unknown> };
  try {
    webhookData = whopsdk.webhooks.unwrap(raw, { headers }) as { type: string; data: Record<string, unknown> };
    console.log("Webhook signature verified");
  } catch (err) {
    console.error("Invalid Whop webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const type = webhookData.type;
  const data = webhookData.data as Record<string, unknown>;

  console.log(`Processing webhook type: ${type}`);

  // Extract user and product information
  const user = data?.user as Record<string, unknown> | undefined;
  const username = (user?.username as string) ?? "";
  const name = (user?.name as string) ?? "";
  const email = (user?.email as string) ?? (data?.email as string) ?? "";
  const product = (data?.product as Record<string, unknown>)?.title as string ?? "";

  console.log("User data:", { username, name, email, product });

  // Split name into first/last if available
  const nameParts = name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Extract payment information
  const finalAmount = data?.final_amount as number | undefined;
  const subtotal = data?.subtotal as number | undefined;
  const currency = ((data?.currency as string)?.toUpperCase() ?? "USD");

  // Format price for display
  const formatPrice = (amount: number | undefined) => {
    if (!amount) return "N/A";
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  // Extract Aurea tracking IDs from checkout session metadata
  const checkoutSession = data?.checkout_session as Record<string, unknown> | undefined;
  const metadata = (checkoutSession?.metadata ?? data?.metadata) as Record<string, unknown> | undefined;
  
  const aureaAnonymousId = (metadata?.aurea_anonymous_id as string) ?? 
    (metadata?.aurea_id as string) ?? "";
  const aureaSessionId = (metadata?.aurea_session_id as string) ?? aureaAnonymousId;
  const checkoutStartedAt = metadata?.checkout_started_at as string | undefined;
  const funnelStage = (metadata?.funnel_stage as string) ?? "checkout";

  console.log(`Aurea tracking IDs - anonymous: ${aureaAnonymousId || "none"}, session: ${aureaSessionId || "none"}`);

  // Create tracking context
  const trackingContext = {
    anonymousId: aureaAnonymousId || (user?.id as string) || "",
    sessionId: aureaSessionId || aureaAnonymousId || (user?.id as string) || "",
    userId: email || undefined,
  };

  // Calculate checkout duration
  const checkoutDuration = checkoutStartedAt
    ? Math.floor((Date.now() - Number.parseInt(checkoutStartedAt, 10)) / 1000)
    : null;

  // Route events to appropriate handlers
  switch (type) {
    case "payment.succeeded": {
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

      // Send Discord notification
      await sendDiscord(
        process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
        createEmbed({
          title: "Payment succeeded",
          description: "A new payment has been successfully processed!",
          color: "success",
          fields,
        })
      );

      // Identify user in Aurea (link anonymous to known user)
      if (email && aureaAnonymousId) {
        await identifyAureaUser(email, aureaAnonymousId, {
          name: name || username || "Unknown",
          email,
          username: username || "",
          product: product || "TTR Membership",
          whopUserId: user?.id || "",
          purchaseDate: new Date().toISOString(),
        });
      }

      // Track conversion in Aurea
      const revenueAmount = finalAmount || subtotal || 9900;
      await trackAureaEvent(
        "checkout_completed",
        {
          conversionType: "purchase",
          revenue: revenueAmount / 100,
          currency,
          orderId: data?.id || "",
          checkoutDuration,
          funnelStage,
          product: product || "TTR Membership",
          username,
          email,
          source: "whop_webhook",
          isConversion: true,
        },
        trackingContext
      );

      // Track membership activation
      await trackAureaEvent(
        "membership_activated",
        {
          product: product || "TTR Membership",
          username,
          email,
          activatedAt: new Date().toISOString(),
        },
        trackingContext
      );

      // Capture email for mailing list
      if (email) {
        const userId = user?.id as string;
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

        // Send welcome email
        await sendWelcomeEmail(email, name || username);
      }
      break;
    }

    case "payment.failed": {
      await sendDiscord(
        process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
        createEmbed({
          title: "Payment Failed",
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
      await trackAureaEvent(
        "payment_failed",
        {
          attemptedRevenue: attemptedAmount / 100,
          currency,
          failureReason: (data?.failure_reason as string) || "unknown",
          product: product || "TTR Membership",
          username,
          email,
        },
        trackingContext
      );

      // Capture email for follow-up
      if (email) {
        const userId = user?.id as string;
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
      break;
    }

    case "payment.pending": {
      await sendDiscord(
        process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
        createEmbed({
          title: "Payment Pending",
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
      await trackAureaEvent(
        "payment_pending",
        {
          pendingRevenue: pendingAmount / 100,
          currency,
          paymentMethod: (data?.payment_method as string) || "unknown",
          product: product || "TTR Membership",
          username,
          email,
        },
        trackingContext
      );

      // Capture email
      if (email) {
        const userId = user?.id as string;
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
      break;
    }

    case "membership.activated": {
      await sendDiscord(
        process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
        createEmbed({
          title: "Membership Activated",
          description: "A new member has joined!",
          color: "success",
          fields: [
            { name: "User", value: `@${username}`, inline: true },
            { name: "Product", value: product, inline: true },
          ],
        })
      );
      // Note: Welcome email sent on payment.succeeded (which has email)
      break;
    }

    case "membership.deactivated": {
      await sendDiscord(
        process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
        createEmbed({
          title: "Membership Deactivated",
          description: "A membership has been deactivated.",
          color: "warning",
          fields: [
            { name: "User", value: `@${username}`, inline: true },
            { name: "Product", value: product, inline: true },
          ],
        })
      );

      // Track in Aurea
      await trackAureaEvent(
        "membership_deactivated",
        {
          deactivationReason: (data?.deactivation_reason as string) || "unknown",
          product: product || "TTR Membership",
          username,
        },
        trackingContext
      );

      // Get email from database and send cancellation email
      const userId = user?.id as string;
      if (userId) {
        const dbUser = await getUserFromDatabase(userId);
        if (dbUser) {
          await addToMailingList({
            email: dbUser.email,
            firstName: dbUser.name?.split(" ")[0] || "",
            lastName: dbUser.name?.split(" ").slice(1).join(" ") || "",
            source: "membership.deactivated",
          });

          await new Promise((resolve) => setTimeout(resolve, 600));
          await sendCancellationEmail(dbUser.email, dbUser.name || dbUser.username || "");
        }
      }
      break;
    }

    case "payment.refunded": {
      const refundAmount = (data?.refunded_amount as number) ?? finalAmount;

      await sendDiscord(
        process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
        createEmbed({
          title: "Payment Refunded",
          description: "A payment has been refunded.",
          color: "warning",
          fields: [
            { name: "User", value: `${name} (@${username})`, inline: true },
            { name: "Product", value: product, inline: true },
            { name: "Refund Amount", value: formatPrice(refundAmount), inline: true },
          ],
        })
      );

      // Track in Aurea
      await trackAureaEvent(
        "payment_refunded",
        {
          refundAmount: (refundAmount || 0) / 100,
          currency,
          refundReason: (data?.refund_reason as string) || "unknown",
          orderId: data?.id || "",
          product: product || "TTR Membership",
          username,
          email,
        },
        trackingContext
      );

      if (email) {
        const userId = user?.id as string;
        if (userId) {
          await storeUserEmail(userId, email, name, username);
        }

        await addToMailingList({
          email,
          firstName,
          lastName,
          source: "payment.refunded",
        });

        await new Promise((resolve) => setTimeout(resolve, 600));
        await sendRefundEmail(email, name, formatPrice(refundAmount));
      }
      break;
    }

    case "membership.went_valid": {
      await sendDiscord(
        process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
        createEmbed({
          title: "Membership Went Valid",
          description: "A trial has ended and membership is now active!",
          color: "success",
          fields: [
            { name: "User", value: `@${username}`, inline: true },
            { name: "Product", value: product, inline: true },
          ],
        })
      );
      break;
    }

    case "membership.went_invalid": {
      await sendDiscord(
        process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
        createEmbed({
          title: "Membership Went Invalid",
          description: "A membership has expired or been cancelled.",
          color: "error",
          fields: [
            { name: "User", value: `@${username}`, inline: true },
            { name: "Product", value: product, inline: true },
          ],
        })
      );

      const userId = user?.id as string;
      if (userId) {
        const dbUser = await getUserFromDatabase(userId);
        if (dbUser) {
          await addToMailingList({
            email: dbUser.email,
            firstName: dbUser.name?.split(" ")[0] || "",
            lastName: dbUser.name?.split(" ").slice(1).join(" ") || "",
            source: "membership.went_invalid",
          });

          await new Promise((resolve) => setTimeout(resolve, 600));
          await sendMembershipExpiredEmail(dbUser.email, dbUser.name || dbUser.username || "");
        }
      }
      break;
    }

    case "payment.account_on_hold": {
      await sendDiscord(
        process.env.DISCORD_PAYMENTS_WEBHOOK_URL!,
        createEmbed({
          title: "Account On Hold",
          description: "Payment method has failed repeatedly. Member needs to update payment.",
          color: "warning",
          fields: [
            { name: "User", value: `${name} (@${username})`, inline: true },
            { name: "Product", value: product, inline: true },
          ],
        })
      );
      break;
    }

    case "membership.cancelled": {
      const cancelReason = (data?.cancellation_reason as string) ?? "Not specified";

      await sendDiscord(
        process.env.DISCORD_MEMBERSHIPS_WEBHOOK_URL!,
        createEmbed({
          title: "Membership Cancelled",
          description: "A member has cancelled their subscription.",
          color: "warning",
          fields: [
            { name: "User", value: `@${username}`, inline: true },
            { name: "Product", value: product, inline: true },
            { name: "Reason", value: cancelReason, inline: false },
          ],
        })
      );

      // Track in Aurea
      await trackAureaEvent(
        "membership_cancelled",
        {
          cancellationReason: cancelReason,
          cancelledAt: new Date().toISOString(),
          product: product || "TTR Membership",
          username,
        },
        trackingContext
      );

      const userId = user?.id as string;
      if (userId) {
        const dbUser = await getUserFromDatabase(userId);
        if (dbUser) {
          await addToMailingList({
            email: dbUser.email,
            firstName: dbUser.name?.split(" ")[0] || "",
            lastName: dbUser.name?.split(" ").slice(1).join(" ") || "",
            source: "membership.cancelled",
          });

          await new Promise((resolve) => setTimeout(resolve, 600));
          await sendCancellationEmail(dbUser.email, dbUser.name || dbUser.username || "");
        }
      }
      break;
    }

    default:
      console.log(`Unhandled webhook type: ${type}`);
  }

  // Return 200 quickly to prevent Whop retries
  return new Response("OK", { status: 200 });
}
