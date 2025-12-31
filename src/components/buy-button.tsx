"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import type { ComponentProps } from "react";
import { trackEvent } from "aurea-tracking-sdk";

interface BuyButtonProps {
  children: React.ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  transition?: { duration: number; delay?: number };
}

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
    // ✅ Get the anonymous ID and session ID from SDK (preferred method)
    let anonymousId = "";
    let sessionId = "";
    
    if (typeof window !== "undefined" && (window as any).aureaSDK) {
      anonymousId = (window as any).aureaSDK.getAnonymousId() || "";
      sessionId = (window as any).aureaSDK.getSessionId() || "";
    } else if (typeof window !== "undefined") {
      // Fallback to localStorage if SDK not available
      anonymousId = localStorage.getItem("aurea_anonymous_id") || "";
      sessionId = sessionStorage.getItem("aurea_session_id") || "";
    }

    // ✅ NEW APPROACH: DON'T end session - keep it alive for webhook linking
    // The session should continue: landing → browse → checkout → purchase webhook
    if (typeof window !== 'undefined' && (window as any).aureaSDK) {
      try {
        console.log("[TTR] Tracking checkout initiation (session stays alive)...");
        
        // Track buy button click
        (window as any).aureaSDK.trackEvent("buy_button_clicked", {
          location: window.location.pathname,
          product: "TTR Membership",
          sessionId,
          anonymousId,
        });
        
        // Mark checkout as started (saves context to localStorage)
        (window as any).aureaSDK.checkoutStarted({
          productId: "ttr_membership",
          productName: "TTR VIP Access",
          price: 99,
          currency: "USD",
          variant: "lifetime"
        });
        
        // Store checkout start time for duration calculation
        sessionStorage.setItem('checkout_started_at', Date.now().toString());
        
        // ✅ CRITICAL: Wait for events to be sent before redirect
        await new Promise(resolve => setTimeout(resolve, 400));
        
      } catch (error) {
        console.error("[TTR] Error tracking checkout:", error);
        // Continue with redirect even if tracking fails
      }
    } else {
      // Fallback to old tracking
      trackEvent("checkout_initiated", {
        product: "TTR Membership",
        productId: "ttr_membership",
        price: 99,
        currency: "USD",
        checkoutUrl: whopUrl,
        anonymousId,
        exitPage: window.location.pathname,
      });
    }

    // Build checkout URL with anonymousId in metadata
    const checkoutUrl = new URL(whopUrl);
    
    // ✅ CRITICAL: Pass anonymousId via URL param (Whop will include in webhook metadata)
    if (anonymousId) {
      checkoutUrl.searchParams.set("aurea_id", anonymousId);
      checkoutUrl.searchParams.set("checkout_session_metadata[aurea_anonymous_id]", anonymousId);
      checkoutUrl.searchParams.set("checkout_session_metadata[aurea_session_id]", sessionId);
      checkoutUrl.searchParams.set("checkout_session_metadata[checkout_started_at]", Date.now().toString());
    }
    
    // ✅ Add return URL for post-purchase redirect
    const returnUrl = new URL(`${window.location.origin}/thank-you`);
    returnUrl.searchParams.set("from_checkout", "true");
    returnUrl.searchParams.set("purchased", "true");
    checkoutUrl.searchParams.set("return_url", returnUrl.toString());

    // Fire-and-forget event tracking
    fetch("/api/events/initiate-checkout", { method: "POST" }).catch(() => {});
    
    // Redirect to Whop (session continues in background)
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
