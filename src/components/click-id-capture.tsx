"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Captures click IDs from URL params on initial page load
 * and stores them in localStorage BEFORE the URL gets cleaned
 */
export function ClickIdCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('[ClickIdCapture] Running...');
    
    // Extract all possible click IDs from URL
    // Check both standard params AND utm_ prefixed versions (fallback for stripped params)
    const extractClickId = (standardName: string, utmName: string) => {
      return searchParams.get(standardName) || searchParams.get(utmName);
    };
    
    // Meta/Facebook
    const fbclid = extractClickId('fbclid', 'utm_fbclid');
    const fbadid = extractClickId('fbadid', 'utm_fbadid');
    
    // Google Ads
    const gclid = extractClickId('gclid', 'utm_gclid');
    const gbraid = extractClickId('gbraid', 'utm_gbraid');
    const wbraid = extractClickId('wbraid', 'utm_wbraid');
    const dclid = extractClickId('dclid', 'utm_dclid');
    
    // TikTok
    const ttclid = extractClickId('ttclid', 'utm_ttclid');
    const tt_content = extractClickId('tt_content', 'utm_tt_content');
    
    // Microsoft/Bing
    const msclkid = extractClickId('msclkid', 'utm_msclkid');
    
    // Twitter/X
    const twclid = extractClickId('twclid', 'utm_twclid');
    
    // LinkedIn
    const li_fat_id = extractClickId('li_fat_id', 'utm_li_fat_id');
    
    // Snapchat
    const ScCid = extractClickId('ScCid', 'utm_sccid');
    
    // Pinterest
    const epik = extractClickId('epik', 'utm_epik');
    
    // Reddit
    const rdt_cid = extractClickId('rdt_cid', 'utm_rdt_cid');
    
    const now = Date.now();
    
    // Attribution windows (in milliseconds)
    const attributionWindows: Record<string, number> = {
      fbclid: 28 * 24 * 60 * 60 * 1000, // 28 days
      fbadid: 28 * 24 * 60 * 60 * 1000,
      gclid: 90 * 24 * 60 * 60 * 1000,  // 90 days
      gbraid: 90 * 24 * 60 * 60 * 1000,
      wbraid: 90 * 24 * 60 * 60 * 1000,
      dclid: 90 * 24 * 60 * 60 * 1000,
      ttclid: 28 * 24 * 60 * 60 * 1000, // 28 days
      tt_content: 28 * 24 * 60 * 60 * 1000,
      msclkid: 90 * 24 * 60 * 60 * 1000, // 90 days
      twclid: 30 * 24 * 60 * 60 * 1000,  // 30 days
      li_fat_id: 90 * 24 * 60 * 60 * 1000, // 90 days
      ScCid: 28 * 24 * 60 * 60 * 1000,    // 28 days
      epik: 30 * 24 * 60 * 60 * 1000,     // 30 days
      rdt_cid: 28 * 24 * 60 * 60 * 1000,  // 28 days
    };
    
    // Build click IDs object
    const newClickIds: Record<string, { id: string; timestamp: number; expiresAt: number }> = {};
    
    if (fbclid) {
      newClickIds.fbclid = {
        id: fbclid,
        timestamp: now,
        expiresAt: now + attributionWindows.fbclid,
      };
    }
    if (fbadid) {
      newClickIds.fbadid = {
        id: fbadid,
        timestamp: now,
        expiresAt: now + attributionWindows.fbadid,
      };
    }
    if (gclid) {
      newClickIds.gclid = {
        id: gclid,
        timestamp: now,
        expiresAt: now + attributionWindows.gclid,
      };
    }
    if (gbraid) {
      newClickIds.gbraid = {
        id: gbraid,
        timestamp: now,
        expiresAt: now + attributionWindows.gbraid,
      };
    }
    if (wbraid) {
      newClickIds.wbraid = {
        id: wbraid,
        timestamp: now,
        expiresAt: now + attributionWindows.wbraid,
      };
    }
    if (dclid) {
      newClickIds.dclid = {
        id: dclid,
        timestamp: now,
        expiresAt: now + attributionWindows.dclid,
      };
    }
    if (ttclid) {
      newClickIds.ttclid = {
        id: ttclid,
        timestamp: now,
        expiresAt: now + attributionWindows.ttclid,
      };
    }
    if (tt_content) {
      newClickIds.tt_content = {
        id: tt_content,
        timestamp: now,
        expiresAt: now + attributionWindows.tt_content,
      };
    }
    if (msclkid) {
      newClickIds.msclkid = {
        id: msclkid,
        timestamp: now,
        expiresAt: now + attributionWindows.msclkid,
      };
    }
    if (twclid) {
      newClickIds.twclid = {
        id: twclid,
        timestamp: now,
        expiresAt: now + attributionWindows.twclid,
      };
    }
    if (li_fat_id) {
      newClickIds.li_fat_id = {
        id: li_fat_id,
        timestamp: now,
        expiresAt: now + attributionWindows.li_fat_id,
      };
    }
    if (ScCid) {
      newClickIds.ScCid = {
        id: ScCid,
        timestamp: now,
        expiresAt: now + attributionWindows.ScCid,
      };
    }
    if (epik) {
      newClickIds.epik = {
        id: epik,
        timestamp: now,
        expiresAt: now + attributionWindows.epik,
      };
    }
    if (rdt_cid) {
      newClickIds.rdt_cid = {
        id: rdt_cid,
        timestamp: now,
        expiresAt: now + attributionWindows.rdt_cid,
      };
    }
    
    // Only store if we found any click IDs
    if (Object.keys(newClickIds).length > 0) {
      try {
        // Get existing click IDs from localStorage
        const existing = localStorage.getItem('aurea_click_ids');
        const existingData = existing ? JSON.parse(existing) : {};
        
        // Merge new with existing (new click IDs overwrite old ones)
        const merged = { ...existingData, ...newClickIds };
        
        // Store back to localStorage
        localStorage.setItem('aurea_click_ids', JSON.stringify(merged));
        
        console.log('[ClickIdCapture] Captured click IDs:', Object.keys(newClickIds));
        console.log('[ClickIdCapture] Stored in localStorage:', merged);
      } catch (error) {
        console.error('[ClickIdCapture] Failed to store click IDs:', error);
      }
    } else {
      console.log('[ClickIdCapture] No click IDs found in URL');
    }
  }, [searchParams]);

  return null;
}
