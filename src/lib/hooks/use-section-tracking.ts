"use client";

import { useEffect, useRef } from "react";
import { getAureaSDK } from "@/components/aurea-tracking";

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
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (trackOnce && hasTracked.current) return;

            const sdk = getAureaSDK();
            if (sdk) {
              const finalEventName = eventName || `${sectionName.toLowerCase().replace(/\s+/g, "_")}_viewed`;
              
              sdk.trackEvent(finalEventName, {
                sectionName,
                visibilityRatio: entry.intersectionRatio,
                viewportHeight: window.innerHeight,
                scrollY: window.scrollY,
              });
            }

            hasTracked.current = true;
            
            if (trackOnce) {
              observer.disconnect();
            }
          }
        }
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
 * Tracks milestones at 25%, 50%, 75%, 90%, and 100%
 */
export function useScrollDepthTracking() {
  useEffect(() => {
    const milestones: Record<number, boolean> = {
      25: false,
      50: false,
      75: false,
      90: false,
      100: false,
    };

    let maxScroll = 0;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;

        const scrollPercent = Math.min(
          100,
          ((scrollTop + windowHeight) / documentHeight) * 100
        );

        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
        }

        // Track milestones
        const sdk = getAureaSDK();
        if (sdk) {
          for (const key of Object.keys(milestones)) {
            const milestone = Number(key);
            if (maxScroll >= milestone && !milestones[milestone]) {
              milestones[milestone] = true;

              sdk.trackEvent(`scroll_depth_${milestone}`, {
                scrollPercent: Math.round(maxScroll),
                scrollTop: Math.round(scrollTop),
                documentHeight,
                windowHeight,
              });
            }
          }
        }
        
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}

/**
 * Hook to track time spent on page
 * Tracks milestones at 30s, 60s, 120s, 180s, and 300s
 */
export function useTimeOnPageTracking() {
  useEffect(() => {
    const startTime = Date.now();
    const milestones: Record<number, boolean> = {
      30: false,
      60: false,
      120: false,
      180: false,
      300: false,
    };

    const interval = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      const sdk = getAureaSDK();

      if (sdk) {
        for (const key of Object.keys(milestones)) {
          const milestone = Number(key);
          if (timeOnPage >= milestone && !milestones[milestone]) {
            milestones[milestone] = true;

            sdk.trackEvent(`time_on_page_${milestone}s`, {
              timeOnPage,
              startTime,
              currentTime: Date.now(),
            });
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);
}

/**
 * Hook to track CTA button hovers
 * Tracks initial hover (after 500ms) and long hover (2+ seconds)
 */
export function useCTAHoverTracking(
  elementRef: React.RefObject<HTMLElement | null>,
  ctaName: string
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let hoverStartTime = 0;
    let hasTrackedHover = false;
    let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleMouseEnter = () => {
      hoverStartTime = Date.now();

      // Track hover after 500ms (shows intent)
      hoverTimeout = setTimeout(() => {
        if (hoverStartTime > 0 && !hasTrackedHover) {
          const sdk = getAureaSDK();
          if (sdk) {
            sdk.trackEvent("cta_hovered", {
              ctaName,
              hoverDuration: 500,
            });
          }
          hasTrackedHover = true;
        }
      }, 500);
    };

    const handleMouseLeave = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      
      if (hoverStartTime > 0) {
        const hoverDuration = Date.now() - hoverStartTime;
        
        // If user hovered for 2+ seconds, track as high intent
        if (hoverDuration >= 2000) {
          const sdk = getAureaSDK();
          if (sdk) {
            sdk.trackEvent("cta_hovered_long", {
              ctaName,
              hoverDuration,
            });
          }
        }
        
        hoverStartTime = 0;
      }
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [elementRef, ctaName]);
}

/**
 * Hook to track user engagement level
 * Combines multiple signals to determine engagement
 * Fires high_engagement_detected when engagement score reaches 50
 */
export function useEngagementTracking() {
  useEffect(() => {
    let interactionCount = 0;
    let lastInteractionTime = Date.now();
    let engagementScore = 0;
    let hasTrackedHighEngagement = false;

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

      // Track high engagement only once
      if (engagementScore >= 50 && !hasTrackedHighEngagement) {
        const sdk = getAureaSDK();
        if (sdk) {
          sdk.trackEvent("high_engagement_detected", {
            interactionCount,
            engagementScore,
            interactionType: type,
            timeToHighEngagement: Date.now() - (lastInteractionTime - timeSinceLastInteraction),
          });
          hasTrackedHighEngagement = true;
        }
      }
    };

    // Throttle event handlers
    let mouseTimeout: ReturnType<typeof setTimeout> | null = null;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const throttledMouseMove = () => {
      if (mouseTimeout) clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => trackInteraction("mouse_move"), 2000);
    };

    const throttledScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => trackInteraction("scroll"), 1000);
    };

    const handleClick = () => trackInteraction("click");
    const handleKeyPress = () => trackInteraction("key_press");

    window.addEventListener("mousemove", throttledMouseMove, { passive: true });
    window.addEventListener("scroll", throttledScroll, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      if (mouseTimeout) clearTimeout(mouseTimeout);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("mousemove", throttledMouseMove);
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);
}

/**
 * Hook to track video playback milestones
 */
export function useVideoTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const milestones: Record<number, boolean> = {
      25: false,
      50: false,
      75: false,
      100: false,
    };
    let hasStarted = false;
    let playCount = 0;

    const handlePlay = () => {
      const sdk = getAureaSDK();
      if (!sdk) return;

      if (!hasStarted) {
        hasStarted = true;
        sdk.trackEvent("video_started", {
          videoSrc: video.src,
          videoDuration: video.duration,
        });
      } else {
        playCount++;
        if (playCount > 1) {
          sdk.trackEvent("video_replayed", {
            videoSrc: video.src,
            playCount,
          });
        }
      }
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      
      const percent = (video.currentTime / video.duration) * 100;
      const sdk = getAureaSDK();
      if (!sdk) return;

      for (const key of Object.keys(milestones)) {
        const milestone = Number(key);
        if (percent >= milestone && !milestones[milestone]) {
          milestones[milestone] = true;

          if (milestone === 100) {
            sdk.trackEvent("video_completed", {
              videoSrc: video.src,
              videoDuration: video.duration,
              watchTime: video.currentTime,
            });
          } else {
            sdk.trackEvent(`video_${milestone}_percent`, {
              videoSrc: video.src,
              currentTime: video.currentTime,
              totalDuration: video.duration,
            });
          }
        }
      }
    };

    const handleEnded = () => {
      // Reset milestones for replay tracking
      for (const key of Object.keys(milestones)) {
        milestones[Number(key)] = false;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef]);
}
