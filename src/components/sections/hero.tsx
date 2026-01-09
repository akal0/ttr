"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { GlowEffect } from "../ui/glow-effect";
import { TextEffect } from "../ui/text-effect";
import { BuyButton } from "../buy-button";
import { useLenis } from "@/lib/lenis-context";
import { getAureaSDK } from "../aurea-tracking";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);
  const { scrollTo } = useLenis();

  // Track hero section view on mount (it's always visible on page load)
  useEffect(() => {
    if (hasTrackedView.current) return;

    const sdk = getAureaSDK();
    if (sdk) {
      // Track immediately since hero is above the fold
      sdk.trackEvent("hero_viewed", {
        sectionName: "hero",
        isAboveTheFold: true,
        timestamp: Date.now(),
      });
      hasTrackedView.current = true;
    }
  }, []);

  return (
    <div
      ref={heroRef}
      id="home"
      className="flex flex-col h-full w-full relative bg-transparent min-h-screen"
    >
      <GlowEffect
        colors={["#1C6DF6", "#1557CC", "#2B7FFF", "#4A8FFF"]}
        mode="breathe"
        blur="strongest"
        duration={3}
        scale={1}
        className="h-[calc(100%-7%)] opacity-65!"
      />

      <Image
        src="/bg.png"
        fill
        className="object-cover absolute h-screen w-screen"
        alt="heroBackground"
      />

      {/* <div className="relative w-full flex items-center justify-center py-8 md:py-5 z-10 text-center px-8">
        <GlowEffect
          colors={["#1C6DF6", "#1557CC", "#2B7FFF", "#4A8FFF"]}
          mode="breathe"
          blur="strongest"
          duration={3}
          scale={1}
          className="h-[calc(100%-7%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent backdrop-blur-2xl" />
        <h1 className="relative text-sm font-medium text-white/75">
          To celebrate the <span className="text-white">New Year</span>, we're
          giving back to you! Use code:
          <span className="text-white"> NEWYEAR </span> at checkout for{" "}
          <span className="text-white">50% off</span> for the next{" "}
          <span className="text-white">48 hours</span> 🎉
        </h1>
      </div> */}

      <div className="flex justify-center md:justify-between items-center py-8 md:max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-[-0.15rem]"> TTR </h1>

        <nav className="gap-6 text-sm relative z-10 hidden md:flex">
          <Link
            href="#testimonials"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#testimonials", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#about", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            About us
          </Link>
          <Link
            href="#payouts"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#payouts", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            Darwinex
          </Link>
          <Link
            href="#faqs"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#faqs", { duration: 1.5 });
            }}
            className="hover:text-blue-300 transition-colors"
          >
            FAQs
          </Link>
        </nav>
      </div>

      <div className="flex flex-col gap-8 items-center justify-center h-full mt-4 md:mt-20 px-4 md:px-0 md:max-w-7xl mx-auto relative z-10">
        {/* Hero content */}
        <div className="flex flex-col gap-8 items-center justify-center h-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center justify-center">
            <TextEffect
              preset="fade-in-blur"
              speedReveal={1.5}
              speedSegment={0.3}
              as="h1"
              className="text-4xl md:text-6xl font-medium md:tracking-[-0.12rem] text-center md:leading-17"
              segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
            >
              Master prop firm trading and build six-figure accounts in a couple
              months
            </TextEffect>

            <div className="flex flex-col gap-3">
              <TextEffect
                per="char"
                delay={1}
                speedReveal={2}
                speedSegment={1}
                className="max-w-2xl text-center tracking-tight font-medium text-lg"
                preset="fade-in-blur"
              >
                Tired of being stuck in the same cycle? Lose. Win. Lose. Lose
                Lose.
              </TextEffect>

              <TextEffect
                per="char"
                delay={1.5}
                speedReveal={3}
                speedSegment={1}
                className="max-w-2xl text-center tracking-tight text-white/85 font-medium"
                preset="fade-in-blur"
              >
                Join Tom's Trading Room and learn the secrets to success.
                Discover the exact frameworks hundreds of traders are using to
                pass prop firm challenges, secure six-figure funding and take
                their trading to the next level.
              </TextEffect>
            </div>
          </div>

          <BuyButton
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 3.5 }}
          >
            Take your first step to profitability
          </BuyButton>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 items-center relative z-20 h-full w-full mt-8">
          <motion.div
            className="rounded-3xl overflow-hidden relative z-10 h-103 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.5 }}
          >
            <Image
              src="/payouts/ftmo.jpeg"
              alt="lifetimeFTMO"
              fill
              className="object-cover object-center md:object-cover w-full h-full rounded-3xl"
            />
          </motion.div>

          <motion.div
            className="rounded-3xl overflow-hidden relative z-10 h-120 md:h-144 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 5.5 }}
          >
            <Image
              src="/payouts/fundingpips.jpeg"
              alt="lifetimeFundingPips"
              fill
              className="object-cover"
            />
          </motion.div>

          <motion.div
            className="rounded-3xl overflow-hidden relative z-10 w-full h-103"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 4.5 }}
          >
            <Image
              src="/payouts/e8.jpeg"
              alt="lifetimeE8"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
