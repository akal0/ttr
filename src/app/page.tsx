"use client";

import { BuyButton } from "@/components/buy-button";
import Hero from "@/components/sections/hero";
import Testimonials from "@/components/sections/testimonials";
import { useEffect, useRef } from "react";

import Lenis from "lenis";
import About from "@/components/sections/about";
import Lifetime from "@/components/sections/lifetime";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";

export default function Home() {
  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis();

    // Make Lenis instance globally accessible
    (window as any).lenis = lenis;

    // Use requestAnimationFrame to continuously update the scroll
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);
  return (
    <main className="min-h-screen flex flex-col bg-[#020513] text-white">
      <Hero />
      <Testimonials />
      <About />
      <Lifetime />
      <CTA />
      <FAQ />
    </main>
  );
}
