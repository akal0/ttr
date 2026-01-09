"use client";

import { useEffect } from "react";
import { initAurea, getAurea } from "aurea-tracking-sdk";
import type { AureaSDK } from "aurea-tracking-sdk";

// Type declaration for window augmentation
declare global {
  interface Window {
    aureaSDK: AureaSDK | null;
  }
}

/**
 * Aurea Tracking Component
 * 
 * This component initializes the Aurea SDK with all tracking features:
 * - Auto page view tracking
 * - Auto scroll depth tracking
 * - Auto form tracking
 * - Core Web Vitals
 * - Custom event categories for TTR funnel
 * - Funnel stage progression
 * - GDPR consent management
 */
export function AureaTracking() {
  useEffect(() => {
    // Only initialize if we have the required env vars
    const apiKey = process.env.NEXT_PUBLIC_AUREA_API_KEY;
    const funnelId = process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID;
    const apiUrl = process.env.NEXT_PUBLIC_AUREA_API_URL;

    // Debug: Log environment variables
    if (process.env.NODE_ENV === "development") {
      console.log("[Aurea] Configuration:", {
        hasApiKey: !!apiKey,
        hasFunnelId: !!funnelId,
        apiUrl: apiUrl || "http://localhost:3000/api",
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 20)}...` : "MISSING",
        funnelIdPreview: funnelId ? `${funnelId.substring(0, 20)}...` : "MISSING",
      });
    }

    if (!apiKey || !funnelId) {
      console.error(
        "[Aurea] Missing API key or Funnel ID. Tracking disabled.",
        { apiKey: !!apiKey, funnelId: !!funnelId }
      );
      return;
    }

    // Check if SDK is already initialized
    const existingSDK = getAurea();
    if (existingSDK) {
      console.log("[Aurea] SDK already initialized, skipping");
      window.aureaSDK = existingSDK;
      return;
    }

    console.log("[Aurea] Initializing SDK...");
    
    const sdk = initAurea({
      apiKey,
      funnelId,
      apiUrl: apiUrl || "http://localhost:3000/api",
      debug: process.env.NODE_ENV === "development",
      
      // Auto-tracking configuration
      autoTrack: {
        pageViews: true,
        forms: true,
        scrollDepth: true,
        outboundLinks: true,
        clicks: false, // We track specific clicks manually for better control
      },
      
      // Privacy settings
      respectDoNotTrack: false, // TTR doesn't require DNT respect
      anonymizeIp: true,
      
      // Batching for performance
      batchSize: 10,
      batchInterval: 2000,
      
      // Enable automatic funnel stage progression
      autoAdvanceStages: true,
      
      // Disable purchase polling - we handle this via webhooks
      purchasePolling: false,
      
      // GDPR consent - not required for TTR (assumed consent via site usage)
      gdprConsent: {
        required: false,
      },
    });
    
    // Register all TTR custom event categories
    registerTTREventCategories(sdk);
    
    console.log("[Aurea] SDK initialized with custom event categories");
    
    // Make SDK available globally for easy access from components
    window.aureaSDK = sdk;
    
    // Cleanup on unmount
    return () => {
      // Don't destroy SDK on unmount - it should persist across page navigations
    };
  }, []);

  return null;
}

/**
 * Register all TTR-specific event categories
 * These define how events are categorized, what value they have,
 * and which funnel stage they should advance the user to.
 */
function registerTTREventCategories(sdk: AureaSDK) {
  sdk.registerEventCategories({
    // ═══════════════════════════════════════════════════════════════════════
    // VIEWING CATEGORY - Page content consumption
    // These events fire when users scroll to and view different sections
    // ═══════════════════════════════════════════════════════════════════════
    
    hero_viewed: {
      category: "viewing",
      advanceTo: "awareness",
      value: 10,
      description: "User scrolled to hero section",
      trackOnce: true,
    },
    testimonials_viewed: {
      category: "viewing",
      advanceTo: "awareness",
      value: 15,
      description: "User scrolled to testimonials section",
      trackOnce: true,
    },
    stats_viewed: {
      category: "viewing",
      advanceTo: "awareness",
      value: 20,
      description: "User scrolled to Darwinex stats section",
      trackOnce: true,
    },
    about_section_viewed: {
      category: "viewing",
      advanceTo: "interest",
      value: 25,
      description: "User scrolled to about section",
      trackOnce: true,
    },
    benefits_section_viewed: {
      category: "viewing",
      advanceTo: "interest",
      value: 30,
      description: "User read benefits section",
      trackOnce: true,
    },
    pricing_section_viewed: {
      category: "viewing",
      advanceTo: "desire",
      value: 60,
      description: "User scrolled to pricing/CTA section",
      trackOnce: true,
    },
    thank_you_page_viewed: {
      category: "viewing",
      value: 5,
      description: "User viewed thank you page after purchase",
      trackOnce: true,
    },
    page_view: {
      category: "viewing",
      value: 5,
      description: "User viewed a page",
      trackOnce: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ENGAGEMENT CATEGORY - Active interaction with content
    // These events fire when users actively engage with page elements
    // ═══════════════════════════════════════════════════════════════════════
    
    video_started: {
      category: "engagement",
      advanceTo: "interest",
      value: 30,
      description: "User started watching sales video",
      trackOnce: false, // Can replay video
    },
    video_25_percent: {
      category: "engagement",
      advanceTo: "interest",
      value: 40,
      description: "User watched 25% of video",
      trackOnce: false,
    },
    video_50_percent: {
      category: "engagement",
      advanceTo: "interest",
      value: 55,
      description: "User watched 50% of video",
      trackOnce: false,
    },
    video_75_percent: {
      category: "engagement",
      advanceTo: "desire",
      value: 75,
      description: "User watched 75% of video - high intent!",
      trackOnce: false,
    },
    video_completed: {
      category: "engagement",
      advanceTo: "desire",
      value: 85,
      description: "User watched entire video",
      trackOnce: false,
    },
    video_replayed: {
      category: "engagement",
      advanceTo: "desire",
      value: 80,
      description: "User replayed video - very high intent",
      trackOnce: false,
    },
    check_email_clicked: {
      category: "engagement",
      value: 10,
      description: "User clicked to check email on thank you page",
      trackOnce: true,
    },
    back_to_home_clicked: {
      category: "engagement",
      value: 5,
      description: "User clicked back to home from thank you page",
      trackOnce: true,
    },
    support_email_clicked: {
      category: "engagement",
      value: 10,
      description: "User clicked support email link",
      trackOnce: false,
    },
    discord_clicked: {
      category: "engagement",
      value: 30,
      description: "User clicked Discord link",
      trackOnce: true,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // INTENT CATEGORY - Purchase consideration signals
    // These events indicate the user is actively researching/considering
    // ═══════════════════════════════════════════════════════════════════════
    
    faq_opened: {
      category: "intent",
      advanceTo: "desire",
      value: 50,
      description: "User opened FAQ to research",
      trackOnce: false, // Allow multiple (different FAQs)
    },
    faq_multiple_opened: {
      category: "intent",
      advanceTo: "desire",
      value: 65,
      description: "User opened 3+ FAQs - researching heavily",
      trackOnce: true,
    },
    cta_section_viewed: {
      category: "intent",
      advanceTo: "desire",
      value: 60,
      description: "User viewed CTA section",
      trackOnce: true,
    },
    cta_hovered: {
      category: "intent",
      advanceTo: "desire",
      value: 70,
      description: "User hovered over buy button",
      trackOnce: true,
    },
    cta_hovered_long: {
      category: "intent",
      advanceTo: "desire",
      value: 75,
      description: "User hovered over buy button for 2+ seconds",
      trackOnce: true,
    },
    contact_clicked: {
      category: "intent",
      value: 40,
      description: "User clicked contact link",
      trackOnce: true,
    },
    checkout_exit: {
      category: "intent",
      value: 0,
      description: "User exited checkout without completing",
      trackOnce: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CONVERSION CATEGORY - Direct purchase actions
    // These are the key conversion events in the funnel
    // ═══════════════════════════════════════════════════════════════════════
    
    buy_button_clicked: {
      category: "conversion",
      advanceTo: "checkout",
      value: 90,
      description: "User clicked buy button - checkout initiated",
      trackOnce: true,
    },
    checkout_initiated: {
      category: "conversion",
      advanceTo: "checkout",
      value: 85,
      description: "User initiated checkout process",
      trackOnce: true,
    },
    checkout_started: {
      category: "conversion",
      advanceTo: "checkout",
      value: 88,
      description: "Checkout session started with product data",
      trackOnce: true,
    },
    whop_checkout_opened: {
      category: "conversion",
      value: 92,
      description: "Whop checkout modal opened",
      trackOnce: true,
    },
    payment_info_entered: {
      category: "conversion",
      value: 95,
      description: "User entered payment information",
      trackOnce: true,
    },
    checkout_completed: {
      category: "conversion",
      advanceTo: "purchase",
      value: 100,
      description: "User completed checkout - sale confirmed",
      trackOnce: true,
    },
    payment_failed: {
      category: "conversion",
      value: 0,
      description: "Payment attempt failed",
      trackOnce: false,
    },
    payment_pending: {
      category: "conversion",
      value: 50,
      description: "Payment is pending confirmation",
      trackOnce: true,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOM CATEGORY - Behavioral tracking milestones
    // These track engagement patterns and time-based milestones
    // ═══════════════════════════════════════════════════════════════════════
    
    scroll_depth: {
      category: "custom",
      value: 10,
      description: "User scrolled to specific depth on page",
      trackOnce: false,
    },
    scroll_depth_25: {
      category: "custom",
      value: 15,
      description: "User scrolled 25% of page",
      trackOnce: true,
    },
    scroll_depth_50: {
      category: "custom",
      advanceTo: "interest",
      value: 25,
      description: "User scrolled 50% of page",
      trackOnce: true,
    },
    scroll_depth_75: {
      category: "custom",
      advanceTo: "desire",
      value: 45,
      description: "User scrolled 75% of page",
      trackOnce: true,
    },
    scroll_depth_90: {
      category: "custom",
      value: 50,
      description: "User scrolled 90% of page",
      trackOnce: true,
    },
    scroll_depth_100: {
      category: "custom",
      value: 55,
      description: "User scrolled to bottom of page",
      trackOnce: true,
    },
    time_on_page_30s: {
      category: "custom",
      advanceTo: "interest",
      value: 30,
      description: "User spent 30+ seconds on page",
      trackOnce: true,
    },
    time_on_page_60s: {
      category: "custom",
      advanceTo: "interest",
      value: 50,
      description: "User spent 60+ seconds on page",
      trackOnce: true,
    },
    time_on_page_120s: {
      category: "custom",
      advanceTo: "desire",
      value: 70,
      description: "User spent 2+ minutes on page - very engaged!",
      trackOnce: true,
    },
    time_on_page_180s: {
      category: "custom",
      value: 80,
      description: "User spent 3+ minutes on page",
      trackOnce: true,
    },
    time_on_page_300s: {
      category: "custom",
      value: 90,
      description: "User spent 5+ minutes on page",
      trackOnce: true,
    },
    debug_test_event: {
      category: "custom",
      value: 0,
      description: "Debug test event for SDK testing",
      trackOnce: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HIGH_ENGAGEMENT CATEGORY - Detected high engagement patterns
    // These are algorithmically detected engagement signals
    // ═══════════════════════════════════════════════════════════════════════
    
    high_engagement_detected: {
      category: "high_engagement",
      color: "fuchsia",
      advanceTo: "desire",
      value: 85,
      description: "High engagement detected - rapid user interactions",
      trackOnce: true,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SESSION CATEGORY - Session lifecycle events
    // These track session start/end and funnel progression
    // ═══════════════════════════════════════════════════════════════════════
    
    session_start: {
      category: "session",
      color: "cyan",
      value: 0,
      description: "User session started",
      trackOnce: false,
    },
    session_end: {
      category: "session",
      color: "cyan",
      value: 0,
      description: "User session ended",
      trackOnce: false,
    },
    funnel_stage_entered: {
      category: "session",
      color: "cyan",
      value: 0,
      description: "User entered new funnel stage",
      trackOnce: false,
    },
    user_identified: {
      category: "session",
      color: "cyan",
      value: 0,
      description: "Anonymous user was identified with email",
      trackOnce: true,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE CATEGORY - Web vitals and performance metrics
    // Auto-tracked by SDK
    // ═══════════════════════════════════════════════════════════════════════
    
    web_vital: {
      category: "performance",
      color: "yellow",
      value: 0,
      description: "Core Web Vitals measurement",
      trackOnce: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MEMBERSHIP EVENTS - Post-purchase lifecycle
    // Tracked via Whop webhooks
    // ═══════════════════════════════════════════════════════════════════════
    
    membership_activated: {
      category: "conversion",
      value: 100,
      description: "User membership was activated",
      trackOnce: true,
    },
    membership_deactivated: {
      category: "session",
      value: 0,
      description: "User membership was deactivated",
      trackOnce: false,
    },
    membership_cancelled: {
      category: "session",
      value: 0,
      description: "User cancelled their membership",
      trackOnce: false,
    },
    payment_refunded: {
      category: "session",
      value: 0,
      description: "Payment was refunded",
      trackOnce: false,
    },
  });
}

/**
 * Helper to get the SDK instance from anywhere
 */
export function getAureaSDK(): AureaSDK | null {
  if (typeof window !== "undefined") {
    return window.aureaSDK || getAurea();
  }
  return null;
}
