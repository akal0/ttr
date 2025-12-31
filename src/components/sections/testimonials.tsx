"use client";

import Image from "next/image";

import { useTransform, useScroll, MotionValue, motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import useDimension from "@/lib/hooks/use-dimension";
import AvatarStack from "../avatar-stack";
import { TextEffect } from "../ui/text-effect";
import { useSectionTracking } from "@/lib/hooks/use-section-tracking";

const testimonials = [
  "/testimonials/1.png",
  "/testimonials/2.png",
  "/testimonials/3.jpeg",
  "/testimonials/4.png",
  "/testimonials/5.png",
  "/testimonials/6.png",
  "/testimonials/7.png",
  "/testimonials/8.png",
  "/testimonials/9.png",
  "/testimonials/10.png",
  "/testimonials/11.png",
  "/testimonials/12.png",
  "/testimonials/13.png",
  "/testimonials/14.png",
  "/testimonials/15.png",
  "/testimonials/16.png",
  "/testimonials/17.png",
  "/testimonials/18.png",
  "/testimonials/19.png",
  "/testimonials/20.png",
  "/testimonials/21.png",
  "/testimonials/22.png",
];

const Testimonials = () => {
  const container = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Track when testimonials section comes into view
  const trackingRef = useSectionTracking({
    sectionName: "Testimonials",
    eventName: "testimonials_viewed",
    threshold: 0.3,
  });

  const { height } = useDimension();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });

  // Use different multipliers for mobile vs desktop
  // Significantly reduce parallax on mobile for smooth performance
  const mobileMultiplier = 0.1;
  const desktopMultiplier = 1;
  const multiplier = isMobile ? mobileMultiplier : desktopMultiplier;

  const y = useTransform(scrollYProgress, [0, 1], [0, height * 2 * multiplier]);
  const y2 = useTransform(
    scrollYProgress,
    [0, 1],
    [0, height * 3.3 * multiplier]
  );
  const y3 = useTransform(
    scrollYProgress,
    [0, 1],
    [0, height * 3 * multiplier]
  );
  const y4 = useTransform(
    scrollYProgress,
    [0, 1],
    [0, height * 2.5 * multiplier]
  );

  return (
    <div
      ref={trackingRef}
      className="w-full flex items-center flex-col gap-8 bg-transparent"
      id="testimonials"
    >
      <div className="py-6 md:py-12 md:space-y-2">
        <TextEffect
          preset="fade-in-blur"
          speedReveal={1.1}
          speedSegment={0.3}
          as="h1"
          className="text-xl md:text-5xl font-medium md:tracking-[-0.1rem] text-center md:leading-13 max-w-2xl"
          segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
        >
          Don't just take my word for it.
        </TextEffect>

        <TextEffect
          preset="fade-in-blur"
          speedReveal={1.1}
          speedSegment={0.3}
          delay={0.75}
          as="h1"
          className="text-xl md:text-5xl font-medium md:tracking-[-0.1rem] text-center md:leading-13 max-w-3xl"
          segmentClassName="bg-clip-text text-transparent bg-linear-to-b from-white to-blue-300"
        >
          Take a look at our members' results.
        </TextEffect>
      </div>

      <div
        className="h-[100vh] md:h-[175vh] bg-[#01030b] flex gap-[0.5vw] p-[0.5vw] box-border overflow-hidden w-full"
        ref={container}
      >
        <Column
          testimonials={[
            testimonials[0],
            testimonials[1],
            testimonials[2],
            testimonials[3],
            testimonials[4],
          ]}
          y={y}
          columnIndex={0}
        />

        <Column
          testimonials={[
            testimonials[5],
            testimonials[6],
            testimonials[7],
            testimonials[8],
            testimonials[9],
          ]}
          y={y2}
          columnIndex={1}
        />

        <Column
          testimonials={[
            testimonials[10],
            testimonials[11],
            testimonials[12],
            testimonials[13],
            testimonials[14],
            testimonials[15],
            testimonials[0],
          ]}
          y={y3}
          columnIndex={2}
        />

        <Column
          testimonials={[
            testimonials[4],
            testimonials[15],
            testimonials[16],
            testimonials[17],
            testimonials[18],
            testimonials[19],
            testimonials[3],
          ]}
          y={y4}
          columnIndex={3}
        />
      </div>
    </div>
  );
};

const Column = ({
  testimonials,
  y,
  columnIndex,
}: {
  testimonials: string[];
  y: MotionValue<number>;
  columnIndex: number;
}) => {
  // Responsive initial translate values
  const translateClasses = [
    "translate-y-[-25%] md:translate-y-[-45%]",
    "translate-y-[-45%] md:translate-y-[-90%]",
    "translate-y-[-40%] md:translate-y-[-75%]",
    "translate-y-[-35%] md:translate-y-[-65%]",
  ];

  return (
    <motion.div
      style={{ y }}
      className={`w-1/4 h-full flex flex-col gap-[0.5vw] min-w-[250px] will-change-transform transform-gpu ${translateClasses[columnIndex]}`}
    >
      {testimonials.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="w-full relative rounded-sm overflow-hidden shrink-0"
        >
          <Image
            src={src}
            width={500}
            height={500}
            alt="testimonial"
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      ))}
    </motion.div>
  );
};

export default Testimonials;
