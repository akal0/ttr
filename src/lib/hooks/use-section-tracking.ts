"use client";

import { useEffect, useRef } from "react";

interface SectionTrackingOptions {
  sectionName: string;
  eventName?: string;
  threshold?: number;
  trackOnce?: boolean;
}

/**
 * Hook to track when a section comes into view
 * Automatically sends event to Aurea SDK with proper categorization
 */
export function useSectionTracking({
  sectionName,
  eventName,
  threshold = 0.5,
  trackOnce = true,
}: SectionTrackingOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (trackOnce && hasTracked.current) return;

            // Track section view using new SDK
            if (typeof window !== "undefined" && (window as any).aureaSDK) {
              const finalEventName = eventName || `${sectionName.toLowerCase().replace(/\s+/g, "_")}_viewed`;
              
              (window as any).aureaSDK.trackEvent(finalEventName, {
                sectionName,
                visibilityRatio: entry.intersectionRatio,
                timestamp: Date.now(),
              });
            }

            hasTracked.current = true;
            
            if (trackOnce) {
              observer.disconnect();
            }
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [sectionName, eventName, threshold, trackOnce]);

  return ref;
}

/**
 * Hook to track scroll depth on a page
 */
export function useScrollDepthTracking() {
  useEffect(() => {
    const milestones = {
      25: false,
      50: false,
      75: false,
      90: false,
      100: false,
    };

    let maxScroll = 0;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const scrollPercent = ((scrollTop + windowHeight) / documentHeight) * 100;

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      // Track milestones
      Object.keys(milestones).forEach((key) => {
        const milestone = Number(key);
        if (maxScroll >= milestone && !milestones[milestone as keyof typeof milestones]) {
          milestones[milestone as keyof typeof milestones] = true;

          if (typeof window !== "undefined" && (window as any).aureaSDK) {
            (window as any).aureaSDK.trackEvent(`scroll_depth_${milestone}`, {
              scrollPercent: maxScroll,
              scrollTop,
              documentHeight,
            });
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}

/**
 * Hook to track time spent on page
 */
export function useTimeOnPageTracking() {
  useEffect(() => {
    const startTime = Date.now();
    const milestones = {
      30: false, // 30 seconds
      60: false, // 1 minute
      120: false, // 2 minutes
      180: false, // 3 minutes
      300: false, // 5 minutes
    };

    const interval = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

      Object.keys(milestones).forEach((key) => {
        const milestone = Number(key);
        if (timeOnPage >= milestone && !milestones[milestone as keyof typeof milestones]) {
          milestones[milestone as keyof typeof milestones] = true;

          if (typeof window !== "undefined" && (window as any).aureaSDK) {
            (window as any).aureaSDK.trackEvent(`time_on_page_${milestone}s`, {
              timeOnPage,
              timestamp: Date.now(),
            });
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
}

/**
 * Hook to track CTA button hovers
 */
export function useCTAHoverTracking(elementRef: React.RefObject<HTMLElement | null>, ctaName: string) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let hoverStartTime = 0;
    let hasTrackedHover = false;

    const handleMouseEnter = () => {
      hoverStartTime = Date.now();

      // Track hover after 500ms (shows intent)
      setTimeout(() => {
        if (hoverStartTime > 0 && !hasTrackedHover) {
          if (typeof window !== "undefined" && (window as any).aureaSDK) {
            (window as any).aureaSDK.trackEvent("cta_hovered", {
              ctaName,
              timestamp: Date.now(),
            });
          }
          hasTrackedHover = true;
        }
      }, 500);
    };

    const handleMouseLeave = () => {
      if (hoverStartTime > 0) {
        const hoverDuration = Date.now() - hoverStartTime;
        
        // If user hovered for 2+ seconds, track as high intent
        if (hoverDuration >= 2000 && typeof window !== "undefined" && (window as any).aureaSDK) {
          (window as any).aureaSDK.trackEvent("cta_hovered_long", {
            ctaName,
            hoverDuration,
            timestamp: Date.now(),
          });
        }
        
        hoverStartTime = 0;
      }
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [elementRef, ctaName]);
}

/**
 * Hook to track user engagement level
 * Combines multiple signals to determine engagement
 */
export function useEngagementTracking() {
  useEffect(() => {
    let interactionCount = 0;
    let lastInteractionTime = Date.now();
    let engagementScore = 0;

    const trackInteraction = (type: string) => {
      interactionCount++;
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;
      lastInteractionTime = Date.now();

      // Calculate engagement score
      if (timeSinceLastInteraction < 5000) {
        engagementScore += 10; // Rapid interactions = high engagement
      } else {
        engagementScore += 5;
      }

      // Track high engagement
      if (engagementScore >= 50 && typeof window !== "undefined" && (window as any).aureaSDK) {
        (window as any).aureaSDK.trackEvent("high_engagement_detected", {
          interactionCount,
          engagementScore,
          interactionType: type,
        });
      }
    };

    const handleMouseMove = () => trackInteraction("mouse_move");
    const handleScroll = () => trackInteraction("scroll");
    const handleClick = () => trackInteraction("click");
    const handleKeyPress = () => trackInteraction("key_press");

    // Throttle event handlers
    let mouseTimeout: NodeJS.Timeout;
    let scrollTimeout: NodeJS.Timeout;

    const throttledMouseMove = () => {
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(handleMouseMove, 2000);
    };

    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 1000);
    };

    window.addEventListener("mousemove", throttledMouseMove, { passive: true });
    window.addEventListener("scroll", throttledScroll, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);
}
