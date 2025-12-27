"use client";

import { BuyButton } from "@/components/buy-button";
import Hero from "@/components/sections/hero";
import Testimonials from "@/components/sections/testimonials";
import { useEffect } from "react";

import Lenis from "lenis";
import About from "@/components/sections/about";
import Lifetime from "@/components/sections/lifetime";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";

export default function Home() {
  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis();

    // Use requestAnimationFrame to continuously update the scroll
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  });
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
