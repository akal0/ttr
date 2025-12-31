"use client";

import Image from "next/image";
import { TextEffect } from "../ui/text-effect";
import { Button, buttonVariants } from "../ui/button";
import { motion, useInView } from "framer-motion";
import { GlowEffect } from "../ui/glow-effect";
import { useRef, useEffect } from "react";
import { BuyButton } from "../buy-button";
import { trackEvent } from "aurea-tracking-sdk";
import {
  useSectionTracking,
  useCTAHoverTracking,
} from "@/lib/hooks/use-section-tracking";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CTA = () => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(buttonRef, { once: true, amount: 0.5 });

  // Track CTA section view with new SDK
  const trackingRef = useSectionTracking({
    sectionName: "Final CTA",
    eventName: "pricing_section_viewed",
    threshold: 0.5,
  });

  // Track CTA button hover
  useCTAHoverTracking(buttonRef, "Join TTR - Final CTA");

  // Track when CTA section comes into view (legacy)
  useEffect(() => {
    if (isInView) {
      // Use new SDK if available
      if (typeof window !== "undefined" && (window as any).aureaSDK) {
        (window as any).aureaSDK.trackEvent("cta_section_viewed", {
          section: "final_cta",
        });
      } else {
        trackEvent("cta_section_viewed", {
          section: "final_cta",
        });
      }
    }
  }, [isInView]);

  return (
    <div className="py-16 pb-0 px-4">
      <div className="flex flex-col w-full max-w-7xl mx-auto h-96 relative rounded-3xl overflow-hidden ring ring-white/2 shadow-2xl md:p-25 py-25 items-center justify-center gap-8">
        <GlowEffect
          colors={["#1C6DF6", "#1557CC", "#2B7FFF", "#4A8FFF"]}
          mode="breathe"
          blur="strongest"
          duration={3}
          scale={1.1}
        />
        <div className="absolute inset-0 bg-black/35 rounded-3xl z-18" />

        <Image
          src="/bg.png"
          alt="CTA Background"
          fill
          className="object-cover absolute z-10 w-full h-full"
        />

        <div className="relative flex flex-col items-center justify-center gap-8 z-20">
          <div className="flex flex-col justify-center items-center h-max md:gap-2">
            <TextEffect
              preset="fade-in-blur"
              speedReveal={1.1}
              speedSegment={0.3}
              as="h1"
              className="text-2xl md:text-5xl font-medium tracking-tight md:tracking-[-0.1rem] text-center"
              segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
            >
              Make the decision today.
            </TextEffect>

            <TextEffect
              preset="fade-in-blur"
              speedReveal={1.1}
              speedSegment={0.3}
              as="h1"
              className="text-2xl md:text-5xl font-medium tracking-tight md:tracking-[-0.1rem] text-center"
              segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
            >
              Your future self will thank you.
            </TextEffect>
          </div>

          <div
            className="flex flex-col md:flex-row gap-2 relative z-11"
            ref={buttonRef}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 1.5, delay: 1 }}
            >
              <Link
                className={cn(
                  buttonVariants({ variant: "discord" }),
                  "relative text-[14px] rounded-[12px] w-full"
                )}
                href="https://discord.gg/ZyAaBcvmwh"
                onClick={() => {
                  trackEvent("discord_clicked", {
                    source: "cta_section",
                    button: "free_discord_access",
                  });
                }}
              >
                Free discord access
              </Link>
            </motion.div>

            <BuyButton
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 1.5, delay: 1 }}
            >
              Join Tom's Trading Room
            </BuyButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;
