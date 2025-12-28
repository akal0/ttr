"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis();
    lenisRef.current = lenis;

    // Make Lenis instance globally accessible for debugging
    if (typeof window !== "undefined") {
      (window as typeof window & { lenis: Lenis }).lenis = lenis;
    }

    // Use requestAnimationFrame to continuously update the scroll
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      if (typeof window !== "undefined") {
        (window as typeof window & { lenis: Lenis | null }).lenis = null;
      }
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}

export function useLenis() {
  const lenis = useContext(LenisContext);

  // Helper function to scroll to a target
  const scrollTo = (
    target: string | HTMLElement,
    options?: Record<string, unknown>,
  ) => {
    if (lenis) {
      lenis.scrollTo(target, options);
    } else {
      // Fallback to native scroll if Lenis isn't ready
      if (typeof target === "string") {
        const element = document.querySelector(target);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return { lenis, scrollTo };
}
