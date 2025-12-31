# Session Duration Fix - Complete Implementation

## Problem Analysis

The current session tracking in TTR has critical gaps:

1. **Checkout Exit:** When user clicks "Buy Now" and navigates to Whop, the session doesn't properly close
2. **Session End Missing:** The SDK's `session_end` event isn't being sent reliably before checkout redirect
3. **Abandoned Checkout:** No tracking when user closes Whop tab without purchasing
4. **Conversion Session:** No linking between pre-checkout session and post-purchase return
5. **Duration Calculation:** Session duration only uses first/last event timestamps, not actual active time

## How Aurea CRM Handles Sessions

The CRM tracks sessions with these fields:

```typescript
FunnelSession {
  startedAt: DateTime              // First event timestamp
  endedAt: DateTime?               // Last event timestamp (or session_end)
  durationSeconds: Int?            // From session_end event OR calculated
  activeTimeSeconds: Int?          // From session_end event (SDK tracked)
  idleTimeSeconds: Int?            // From session_end event (SDK tracked)
  engagementRate: Float?           // (activeTime / duration) * 100
  
  // Checkout flow
  checkoutStartedAt: DateTime?     // When checkout_started event fires
  checkoutCompletedAt: DateTime?   // When checkout_completed event fires
  checkoutDuration: Int?           // Seconds in checkout flow
  isAbandoned: Boolean             // Did user abandon checkout?
  abandonedAt: DateTime?           // When abandoned
  abandonReason: String?           // Why abandoned
}
```

**Current Flow:**
```
1. SDK tracks page_view, events → Creates FunnelSession with startedAt
2. User clicks Buy → checkout_started event → Sets checkoutStartedAt
3. User leaves to Whop → ❌ No session_end sent (page unload blocked by redirect)
4. User completes purchase → checkout_completed event → Sets checkoutCompletedAt
5. Session duration = lastEvent.timestamp - firstEvent.timestamp ❌ WRONG
```

**Problems:**
- Time spent on Whop is NOT part of session duration (correct)
- But session_end event never fires, so no activeTime/idleTime/engagementRate
- Session endedAt is the checkout_started timestamp, not actual end time
- Abandoned checkouts have no tracking

## Solution: Multi-Scenario Session Tracking

We need to handle **5 distinct scenarios:**

### Scenario 1: Normal Session (No Checkout)
User visits, browses, leaves without buying.

**Expected Behavior:**
- Session ends on page unload
- SDK sends `session_end` event with active/idle time
- Duration = time on TTR site

### Scenario 2: Checkout Initiated (Abandoned)
User clicks Buy, goes to Whop, doesn't purchase, closes tab.

**Expected Behavior:**
- Session ends when Buy button clicked (before redirect)
- SDK sends `session_end` event with active/idle time
- Checkout session created but not completed
- After timeout (30 min), mark as abandoned

### Scenario 3: Checkout Completed (Purchase)
User clicks Buy, completes purchase, returns to thank-you page.

**Expected Behavior:**
- Original session ends when Buy button clicked
- NEW session starts on thank-you page
- Both sessions linked via `linkedSessionId`
- Total journey time = original session + checkout duration + thank-you session

### Scenario 4: Checkout Started, Back Button
User clicks Buy, immediately goes back without purchasing.

**Expected Behavior:**
- Session continues (not ended)
- Checkout marked as abandoned immediately
- User can continue browsing

### Scenario 5: Multiple Checkout Attempts
User clicks Buy multiple times (different sessions).

**Expected Behavior:**
- Each attempt tracked separately
- Final purchase linked to most recent session

## Implementation Plan

### Part 1: Fix Session End Before Checkout Redirect

**File:** `src/components/buy-button.tsx`

**Changes Needed:**

```typescript
async function onClick() {
  // Get the anonymous ID
  let anonymousId = "";
  if (typeof window !== "undefined") {
    anonymousId = localStorage.getItem("aurea_anonymous_id") || "";
  }

  // ✅ NEW: Force session end BEFORE redirect
  if (typeof window !== 'undefined' && (window as any).aureaSDK) {
    // End the current session with proper timing data
    await (window as any).aureaSDK.endSession();
    
    // Track buy button click
    (window as any).aureaSDK.trackEvent("buy_button_clicked", {
      location: window.location.pathname,
      product: "TTR Membership"
    });
    
    // Call checkoutStarted() - preserves session context!
    (window as any).aureaSDK.checkoutStarted({
      productId: "ttr_membership",
      productName: "TTR VIP Access",
      price: 99,
      currency: "USD",
      variant: "lifetime"
    });
    
    // ✅ NEW: Wait for events to be sent
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Build checkout URL
  const checkoutUrl = new URL(whopUrl);
  if (anonymousId) {
    checkoutUrl.searchParams.set("aurea_id", anonymousId);
  }
  
  const returnUrl = new URL(window.location.origin + "/thank-you");
  returnUrl.searchParams.set("from_checkout", "true");
  returnUrl.searchParams.set("session_id", sessionStorage.getItem("aurea_session_id") || "");
  checkoutUrl.searchParams.set("return_url", returnUrl.toString());

  // Fire-and-forget event tracking
  fetch("/api/events/initiate-checkout", { method: "POST" }).catch(() => {});
  
  // Redirect to Whop
  window.location.href = checkoutUrl.toString();
}
```

**Key Changes:**
1. Call `aureaSDK.endSession()` before redirect
2. Wait 300ms for events to be sent
3. Pass original `session_id` to thank-you page for linking

### Part 2: Track Checkout Session Duration

**File:** `src/app/api/webhooks/whop/route.ts`

**Add Checkout Duration Tracking:**

```typescript
// After identifyAureaUser() call (line 197)
if (typeof window !== 'undefined' && (window as any).aureaSDK) {
  await identifyAureaUser();
  
  // ✅ NEW: Calculate checkout duration
  const checkoutStartTime = sessionStorage.getItem('checkout_started_at');
  const checkoutDuration = checkoutStartTime 
    ? Math.floor((Date.now() - parseInt(checkoutStartTime)) / 1000)
    : null;
  
  // Track conversion with checkout duration
  await trackAureaEvent("purchase", {
    conversionType: "purchase",
    revenue: revenueAmount / 100,
    currency: currency || "USD",
    orderId: data?.id || "",
    checkoutDuration, // ✅ NEW: Track time spent in Whop checkout
  });
}
```

### Part 3: Track Abandoned Checkouts

**File:** `src/app/api/cron/check-abandoned/route.ts`

Create a cron job that runs every 5 minutes:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find checkout sessions started >30 min ago with no completion
    const abandonedCheckouts = await findAbandonedCheckouts();
    
    for (const session of abandonedCheckouts) {
      // Send checkout_abandoned event to Aurea
      await fetch(`${process.env.NEXT_PUBLIC_AUREA_API_URL}/track/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aurea-API-Key": process.env.NEXT_PUBLIC_AUREA_API_KEY || "",
          "X-Aurea-Funnel-ID": process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID || "",
        },
        body: JSON.stringify({
          events: [{
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventName: "checkout_abandoned",
            properties: {
              reason: "timeout_30min",
              checkoutStartedAt: session.checkoutStartedAt,
              abandonedAt: new Date().toISOString(),
            },
            context: {
              user: {
                anonymousId: session.anonymousId,
              },
              session: {
                sessionId: session.sessionId,
              },
            },
            timestamp: Date.now(),
          }],
          batch: true,
        }),
      });
      
      console.log(`✅ Marked checkout as abandoned: ${session.sessionId}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      abandoned: abandonedCheckouts.length 
    });
  } catch (error) {
    console.error("Error checking abandoned checkouts:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function findAbandonedCheckouts() {
  // This would query your database or tracking system
  // For now, we'll use the in-memory checkout sessions
  const { getAllCheckoutSessions } = await import("@/app/api/checkout/init/route");
  const sessions = getAllCheckoutSessions();
  
  const thirtyMinAgo = Date.now() - (30 * 60 * 1000);
  
  return sessions
    .filter(([_, session]) => session.timestamp < thirtyMinAgo)
    .map(([anonymousId, session]) => ({
      sessionId: anonymousId,
      anonymousId,
      checkoutStartedAt: new Date(session.timestamp),
    }));
}
```

**Set up Vercel Cron:**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-abandoned",
    "schedule": "*/5 * * * *"
  }]
}
```

### Part 4: Link Sessions on Thank You Page

**File:** `src/app/thank-you/page.tsx`

**Update to link sessions:**

```typescript
useEffect(() => {
  setMounted(true);

  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get("email");
  const userName = urlParams.get("name");
  const orderId = urlParams.get("order_id") || urlParams.get("transaction_id") || `order_${Date.now()}`;
  const fromCheckout = urlParams.get("from_checkout") === "true";
  const originalSessionId = urlParams.get("session_id"); // ✅ NEW: Get original session ID

  // Use new SDK checkoutCompleted() method
  if (typeof window !== 'undefined' && (window as any).aureaSDK) {
    // ✅ NEW: Pass original session ID for linking
    (window as any).aureaSDK.checkoutCompleted({
      orderId,
      revenue: 99,
      currency: "USD",
      paymentMethod: "stripe",
      products: [{
        productId: "ttr_membership",
        productName: "TTR VIP Access",
        price: 99,
        currency: "USD",
        quantity: 1
      }],
      originalSessionId, // ✅ Link to pre-checkout session
      checkoutDuration: null, // Will be calculated by webhook
    });
    
    console.log("[TTR] Checkout completed tracked with session bridging");
  }

  // ... rest of code
}, []);
```

### Part 5: Enhanced Buy Button with Session Preservation

**Create new component:** `src/components/enhanced-buy-button.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ComponentProps, useRef } from "react";

interface EnhancedBuyButtonProps {
  children: React.ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  transition?: { duration: number; delay?: number };
}

export function EnhancedBuyButton({
  children,
  variant = "gradient",
  className = "relative text-[14px] rounded-[12px]",
  initial,
  animate,
  transition,
}: EnhancedBuyButtonProps) {
  const whopUrl = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/your-product";
  const isRedirecting = useRef(false);

  async function onClick() {
    if (isRedirecting.current) return; // Prevent double-click
    isRedirecting.current = true;

    try {
      // Get tracking IDs
      const anonymousId = localStorage.getItem("aurea_anonymous_id") || "";
      const sessionId = sessionStorage.getItem("aurea_session_id") || "";

      if (typeof window !== 'undefined' && (window as any).aureaSDK) {
        // ✅ STEP 1: End the current session with timing data
        console.log("[TTR] Ending session before checkout redirect...");
        await (window as any).aureaSDK.endSession();
        
        // ✅ STEP 2: Track buy button click
        (window as any).aureaSDK.trackEvent("buy_button_clicked", {
          location: window.location.pathname,
          product: "TTR Membership",
          sessionId,
        });
        
        // ✅ STEP 3: Mark checkout as started
        (window as any).aureaSDK.checkoutStarted({
          productId: "ttr_membership",
          productName: "TTR VIP Access",
          price: 99,
          currency: "USD",
          variant: "lifetime",
        });
        
        // ✅ STEP 4: Store checkout start time for duration calculation
        sessionStorage.setItem('checkout_started_at', Date.now().toString());
        
        // ✅ STEP 5: Wait for events to be sent (important!)
        await new Promise(resolve => setTimeout(resolve, 400));
        
        console.log("[TTR] Session ended, events sent. Redirecting...");
      }

      // Build checkout URL with session tracking
      const checkoutUrl = new URL(whopUrl);
      
      if (anonymousId) {
        checkoutUrl.searchParams.set("aurea_id", anonymousId);
      }
      
      // Build return URL with session ID for linking
      const returnUrl = new URL(window.location.origin + "/thank-you");
      returnUrl.searchParams.set("from_checkout", "true");
      returnUrl.searchParams.set("session_id", sessionId);
      returnUrl.searchParams.set("purchased", "true");
      checkoutUrl.searchParams.set("return_url", returnUrl.toString());

      // Track checkout initiation on backend
      await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId }),
      }).catch(() => {});

      // Redirect to Whop
      window.location.href = checkoutUrl.toString();
    } catch (error) {
      console.error("[TTR] Error during checkout initiation:", error);
      isRedirecting.current = false;
    }
  }

  const buttonContent = (
    <Button onClick={onClick} className={className} variant={variant}>
      {children}
    </Button>
  );

  if (initial || animate || transition) {
    return (
      <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
      >
        {buttonContent}
      </motion.div>
    );
  }

  return buttonContent;
}
```

## SDK Methods Required

The Aurea Tracking SDK needs to expose these methods:

### 1. `endSession()`
Manually end the current session and send `session_end` event.

```typescript
async endSession(): Promise<void> {
  const sessionData = this.calculateSessionMetrics();
  
  await this.trackEvent("session_end", {
    duration: sessionData.durationSeconds,
    activeTime: sessionData.activeTimeSeconds,
    idleTime: sessionData.idleTimeSeconds,
    engagementRate: sessionData.engagementRate,
  });
  
  // Send immediately (don't batch)
  await this.flushEvents();
}
```

### 2. Enhanced `checkoutStarted()`
Already exists, just ensure it doesn't end session.

### 3. Enhanced `checkoutCompleted()`
Accept `originalSessionId` for linking.

```typescript
async checkoutCompleted(params: {
  orderId: string;
  revenue: number;
  currency: string;
  products: Product[];
  originalSessionId?: string; // ✅ NEW
  checkoutDuration?: number;  // ✅ NEW
}): Promise<void> {
  await this.trackEvent("checkout_completed", {
    ...params,
    timestamp: Date.now(),
  });
}
```

## Testing Scenarios

### Test 1: Normal Browse → Leave
1. Visit TTR
2. Browse for 30 seconds
3. Close tab
4. **Expected:** Session has `durationSeconds: 30`, `activeTimeSeconds`, `engagementRate`

### Test 2: Browse → Checkout → Purchase
1. Visit TTR
2. Browse for 2 minutes
3. Click Buy (session ends)
4. Complete purchase on Whop (3 minutes)
5. Return to thank-you page
6. **Expected:** 
   - Original session: `durationSeconds: 120`, `endedAt: <checkout time>`, `checkoutStartedAt: <checkout time>`
   - New session: `linkedSessionId: <original>`, `checkoutCompletedAt: <completion>`, `checkoutDuration: 180`

### Test 3: Browse → Checkout → Abandon
1. Visit TTR
2. Browse for 1 minute
3. Click Buy
4. Go to Whop
5. Close tab
6. Wait 31 minutes
7. **Expected:** 
   - Session: `durationSeconds: 60`, `checkoutStartedAt: <time>`, `isAbandoned: true`, `abandonedAt: <30 min later>`

### Test 4: Multiple Checkout Attempts
1. Visit TTR
2. Click Buy → Go back immediately
3. Browse more
4. Click Buy again → Complete purchase
5. **Expected:**
   - First checkout: `checkout_started` then `checkout_abandoned` (immediate)
   - Second checkout: `checkout_started` → `checkout_completed`

## Implementation Checklist

### Frontend (TTR)
- [ ] Update `buy-button.tsx` to call `endSession()` before redirect
- [ ] Add 400ms delay for event sending
- [ ] Pass `session_id` to thank-you page
- [ ] Update thank-you page to pass `originalSessionId` to `checkoutCompleted()`
- [ ] Store `checkout_started_at` in sessionStorage

### Backend (TTR)
- [ ] Update webhook to track `checkoutDuration` in conversion event
- [ ] Create cron job for abandoned checkout detection
- [ ] Set up Vercel cron configuration
- [ ] Add environment variable `CRON_SECRET`

### SDK (Aurea Tracking SDK)
- [ ] Implement `endSession()` method
- [ ] Ensure `session_end` event includes active/idle time
- [ ] Update `checkoutCompleted()` to accept `originalSessionId`
- [ ] Add `flushEvents()` method to force immediate send

### CRM (Aurea CRM)
- [ ] Verify `checkout_abandoned` event handling (already exists ✅)
- [ ] Verify session linking via `linkedSessionId` (already exists ✅)
- [ ] Test session duration calculations with new data

## Expected Results

After implementation, Aurea CRM will show:

**Visitor Profile:**
```
Session 1 (Pre-Checkout):
  Started: 2:00 PM
  Ended: 2:02 PM
  Duration: 2 minutes
  Active Time: 1 min 45s
  Idle Time: 15s
  Engagement Rate: 87.5%
  Checkout Started: 2:02 PM
  
Session 2 (Post-Purchase):
  Started: 2:05 PM
  Ended: 2:05 PM
  Duration: 30 seconds
  Linked Session: Session 1
  Checkout Completed: 2:05 PM
  Checkout Duration: 3 minutes
  Converted: Yes
  Revenue: $99
```

**Total Journey:**
- Time on TTR: 2 min 30s (Session 1 + Session 2)
- Time on Whop: 3 min (Checkout Duration)
- Total Engagement: 5 min 30s
- Conversion: Yes

## Migration Path

### Phase 1: Add Session End (No Breaking Changes)
1. Update buy-button.tsx to call endSession()
2. Test with existing SDK version
3. Monitor session durations improve

### Phase 2: Add Abandoned Checkout Tracking
1. Create cron job
2. Deploy to Vercel
3. Monitor abandoned checkouts

### Phase 3: Add Session Linking
1. Update SDK to accept originalSessionId
2. Update thank-you page
3. Verify linked sessions in CRM

### Phase 4: Full Testing
1. Test all 5 scenarios
2. Verify data accuracy in CRM
3. Document findings

## Success Metrics

After implementation, you should see:

1. ✅ **100% of sessions have duration data** (not just timestamp diff)
2. ✅ **Active time vs idle time breakdown** for all sessions
3. ✅ **Accurate engagement rates** (active / total time)
4. ✅ **Checkout sessions properly ended** before redirect
5. ✅ **Abandoned checkouts tracked** within 30 minutes
6. ✅ **Session linking** between pre/post checkout
7. ✅ **Checkout duration** accurately measured

This will give you the complete analytics picture you need! 🎯
