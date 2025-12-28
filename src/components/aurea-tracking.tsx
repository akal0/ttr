"use client";

import { useEffect } from "react";
import { initAurea } from "aurea-tracking-sdk";

export function AureaTracking() {
  useEffect(() => {
    // Only initialize if we have the required env vars
    const apiKey = process.env.NEXT_PUBLIC_AUREA_API_KEY;
    const funnelId = process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID;
    const apiUrl = process.env.NEXT_PUBLIC_AUREA_API_URL;

    // Debug: Log environment variables
    console.log("[Aurea] Configuration:", {
      hasApiKey: !!apiKey,
      hasFunnelId: !!funnelId,
      apiUrl: apiUrl || "http://localhost:3000/api",
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 20)}...` : "MISSING",
      funnelIdPreview: funnelId ? `${funnelId.substring(0, 20)}...` : "MISSING",
    });

    if (!apiKey || !funnelId) {
      console.error(
        "[Aurea] Missing API key or Funnel ID. Tracking disabled.",
        { apiKey: !!apiKey, funnelId: !!funnelId }
      );
      return;
    }

    console.log("[Aurea] Initializing SDK...");
    const sdk = initAurea({
      apiKey,
      funnelId,
      apiUrl: apiUrl || "http://localhost:3000/api",
      debug: true, // Enable debug mode to see events
      autoTrack: {
        pageViews: true,
        forms: true,
        scrollDepth: true,
        clicks: false,
      },
    });
    
    console.log("[Aurea] SDK initialized:", sdk);
  }, []);

  return null;
}
