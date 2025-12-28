"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ComponentProps } from "react";
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
    // Get the anonymous ID from localStorage to pass to Whop
    let anonymousId = "";
    if (typeof window !== "undefined") {
      anonymousId = localStorage.getItem("aurea_anonymous_id") || "";
    }

    // Track in Aurea
    trackEvent("checkout_initiated", {
      product: "TTR Membership",
      productId: "ttr_membership",
      price: 99,
      currency: "USD",
      checkoutUrl: whopUrl,
      anonymousId, // Include for reference
      exitPage: window.location.pathname,
    });

    // Track checkout exit (leaving the site)
    trackEvent("checkout_exit", {
      destination: "whop_checkout",
      exitUrl: window.location.href,
    });

    // Append anonymousId to Whop checkout URL as a query parameter
    const checkoutUrl = new URL(whopUrl);
    if (anonymousId) {
      checkoutUrl.searchParams.set("aurea_id", anonymousId);
    }
    
    // Add return URL parameter so Whop can redirect back to thank-you page
    const returnUrl = new URL(window.location.origin + "/thank-you");
    returnUrl.searchParams.set("from_checkout", "true");
    checkoutUrl.searchParams.set("return_url", returnUrl.toString());

    // Fire-and-forget event tracking
    fetch("/api/events/initiate-checkout", { method: "POST" }).catch(() => {});
    
    // Small delay to ensure events are sent before navigation
    setTimeout(() => {
      window.location.href = checkoutUrl.toString();
    }, 100);
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
