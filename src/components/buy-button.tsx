"use client";

import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { getAureaSDK } from "./aurea-tracking";
import { Button } from "./ui/button";

interface BuyButtonProps {
  children: React.ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  transition?: { duration: number; delay?: number };
}

/**
 * Buy Button Component
 * 
 * Handles the checkout flow with proper Aurea SDK integration:
 * 1. Tracks buy_button_clicked event
 * 2. Calls checkoutStarted() to save session context
 * 3. Passes anonymousId/sessionId to Whop for webhook linking
 * 4. Redirects to Whop checkout
 */
export function BuyButton({
  children,
  variant = "gradient",
  className = "relative text-[14px] rounded-[12px]",
  initial,
  animate,
  transition,
}: BuyButtonProps) {
  const whopUrl =
    process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/your-product";

  async function onClick() {
    const sdk = getAureaSDK();
    
    // Get tracking IDs from SDK
    let anonymousId = "";
    let sessionId = "";
    
    if (sdk) {
      anonymousId = sdk.getAnonymousId() || "";
      sessionId = sdk.getSessionId() || "";
    } else if (typeof window !== "undefined") {
      // Fallback to localStorage if SDK not available
      anonymousId = localStorage.getItem("aurea_anonymous_id") || "";
      sessionId = sessionStorage.getItem("aurea_session_id") || "";
    }

    // Get current funnel stage for context
    const currentStage = sdk?.getCurrentStage() || "unknown";
    const stageHistory = sdk?.getStageHistory() || [];

    if (sdk) {
      try {
        console.log("[TTR] Tracking checkout initiation...");
        console.log("[TTR] Current stage:", currentStage);
        console.log("[TTR] Stage history:", stageHistory);
        
        // Track buy button click with rich context
        sdk.trackEvent("buy_button_clicked", {
          location: window.location.pathname,
          product: "TTR Membership",
          productId: "ttr_membership",
          price: 99,
          currency: "USD",
          sessionId,
          anonymousId,
          currentStage,
          stageCount: stageHistory.length,
        });
        
        // Call checkoutStarted() - this:
        // 1. Advances funnel stage to 'checkout'
        // 2. Saves checkout context to localStorage for session bridging
        // 3. Tracks checkout_started event
        sdk.checkoutStarted({
          productId: "ttr_membership",
          productName: "TTR VIP Access",
          price: 99,
          currency: "USD",
          quantity: 1,
          variant: "lifetime",
        });
        
        // Store checkout start time for duration calculation
        sessionStorage.setItem("checkout_started_at", Date.now().toString());
        
        // Wait for events to be sent before redirect
        await new Promise(resolve => setTimeout(resolve, 400));
        
      } catch (error) {
        console.error("[TTR] Error tracking checkout:", error);
        // Continue with redirect even if tracking fails
      }
    } else {
      console.warn("[TTR] SDK not available, using fallback tracking");
      // Store minimal tracking data
      sessionStorage.setItem("checkout_started_at", Date.now().toString());
    }

    // Build checkout URL with tracking metadata
    const checkoutUrl = new URL(whopUrl);
    
    // Pass tracking IDs via URL params (Whop includes these in webhook metadata)
    if (anonymousId) {
      // Primary params
      checkoutUrl.searchParams.set("aurea_id", anonymousId);
      
      // Checkout session metadata (Whop specific)
      checkoutUrl.searchParams.set(
        "checkout_session_metadata[aurea_anonymous_id]",
        anonymousId
      );
      checkoutUrl.searchParams.set(
        "checkout_session_metadata[aurea_session_id]",
        sessionId
      );
      checkoutUrl.searchParams.set(
        "checkout_session_metadata[checkout_started_at]",
        Date.now().toString()
      );
      checkoutUrl.searchParams.set(
        "checkout_session_metadata[funnel_stage]",
        currentStage
      );
    }
    
    // Add return URL for post-purchase redirect
    const returnUrl = new URL(`${window.location.origin}/thank-you`);
    returnUrl.searchParams.set("from_checkout", "true");
    returnUrl.searchParams.set("purchased", "true");
    returnUrl.searchParams.set("session_id", sessionId);
    checkoutUrl.searchParams.set("return_url", returnUrl.toString());

    // Fire-and-forget Discord notification
    fetch("/api/events/initiate-checkout", { method: "POST" }).catch(() => {});
    
    // Redirect to Whop checkout
    console.log("[TTR] Redirecting to Whop with anonymousId:", anonymousId);
    window.location.href = checkoutUrl.toString();
  }

  const buttonContent = (
    <Button onClick={onClick} className={className} variant={variant}>
      {children}
    </Button>
  );

  // If animation props are provided, wrap in motion.div
  if (initial || animate || transition) {
    return (
      <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
      >
        {buttonContent}
      </motion.div>
    );
  }

  return buttonContent;
}
