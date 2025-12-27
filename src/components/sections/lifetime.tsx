import Image from "next/image";
import { TextEffect } from "../ui/text-effect";
import DarwinexStats from "./darwinex-stats";

const Lifetime = () => {
  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto py-16 gap-16">
      <div className="flex flex-col gap-2 items-center justify-center">
        <TextEffect
          preset="fade-in-blur"
          speedReveal={1.1}
          speedSegment={0.3}
          as="h1"
          className="text-5xl font-medium tracking-[-0.1rem] text-center leading-17"
          segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
        >
          Still think it's hype?
        </TextEffect>

        <div className="flex flex-col items-center justify-center">
          <TextEffect
            per="char"
            speedReveal={3.5}
            speedSegment={0.3}
            className="text-center text-lg text-white/65 max-w-3xl mx-auto leading-7"
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
            className="text-center text-lg text-white font-medium max-w-3xl mx-auto leading-7"
            preset="fade-in-blur"
          >
            The lifetime payouts speak for me.
          </TextEffect>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="rounded-3xl overflow-hidden relative h-103">
          <Image
            src="/payouts/ftmo.jpeg"
            alt="lifetimeFTMO"
            width={1000}
            height={1000}
          />
        </div>

        <div className="rounded-3xl overflow-hidden relative h-144">
          <Image
            src="/payouts/fundingpips.jpeg"
            alt="lifetimeFundingPips"
            fill
            className="object-cover"
          />
        </div>

        <div className="rounded-3xl overflow-hidden relative">
          <Image
            src="/payouts/e8.jpeg"
            alt="lifetimeE8"
            width={1000}
            height={1000}
          />
        </div>
      </div>

      <DarwinexStats />
    </div>
  );
};

export default Lifetime;
