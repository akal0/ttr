"use client";

import Hero from "@/components/sections/hero";
import Testimonials from "@/components/sections/testimonials";
import About from "@/components/sections/about";
import Lifetime from "@/components/sections/lifetime";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";
import { LenisProvider } from "@/lib/lenis-context";

export default function Home() {
  return (
    <LenisProvider>
      <main className="min-h-screen flex flex-col bg-[#020513] text-white">
        <Hero />
        <Testimonials />
        <About />
        <Lifetime />
        <CTA />
        <FAQ />
      </main>
    </LenisProvider>
  );
}
