"use client";

import Image from "next/image";
import { TextEffect } from "../ui/text-effect";
import DarwinexStats from "./darwinex-stats";
import { useSectionTracking } from "@/lib/hooks/use-section-tracking";

const Lifetime = () => {
  const trackingRef = useSectionTracking({
    sectionName: "Payouts",
    eventName: "stats_viewed",
    threshold: 0.4,
  });

  return (
    <div
      ref={trackingRef}
      id="payouts"
      className="flex flex-col h-full w-full max-w-7xl mx-auto md:py-16 gap-16 px-4 md:px-0"
    >
      <div className="flex flex-col gap-2 items-center justify-center">
        <TextEffect
          preset="fade-in-blur"
          speedReveal={1.1}
          speedSegment={0.3}
          as="h1"
          className="text-4xl md:text-5xl font-medium md:tracking-[-0.1rem] text-center md:leading-17"
          segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
        >
          Still think it's hype?
        </TextEffect>

        <div className="flex flex-col items-center justify-center space-y-2 md:space-y-0">
          <TextEffect
            per="char"
            speedReveal={3.5}
            speedSegment={0.3}
            className="text-center md:text-lg text-white/65 max-w-3xl mx-auto md:leading-7"
            preset="fade-in-blur"
          >
            Believe me, you're in good hands. The testimonials speak for the
            members themselves.
          </TextEffect>

          <TextEffect
            per="char"
            speedReveal={2}
            delay={0.75}
            speedSegment={0.3}
            className="text-center md:text-lg text-white font-medium max-w-3xl mx-auto md:leading-7"
            preset="fade-in-blur"
          >
            My Darwinex speaks for me.
          </TextEffect>
        </div>
      </div>

      {/* <div className="flex flex-col md:grid md:grid-cols-3 gap-4 items-center">
        <div className="rounded-3xl overflow-hidden relative h-103 w-full">
          <Image
            src="/payouts/ftmo.jpeg"
            alt="lifetimeFTMO"
            fill
            className="object-cover"
          />
        </div>

        <div className="rounded-3xl overflow-hidden relative h-120 md:h-144 w-full">
          <Image
            src="/payouts/fundingpips.jpeg"
            alt="lifetimeFundingPips"
            fill
            className="object-cover"
          />
        </div>

        <div className="rounded-3xl overflow-hidden relative w-full h-103">
          <Image
            src="/payouts/e8.jpeg"
            alt="lifetimeE8"
            fill
            className="object-cover"
          />
        </div>
      </div> */}

      <DarwinexStats />
    </div>
  );
};

export default Lifetime;
