"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ComponentProps } from "react";

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
    // Fire-and-forget event tracking
    fetch("/api/events/initiate-checkout", { method: "POST" }).catch(() => {});
    window.location.href = whopUrl;
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
