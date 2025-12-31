# Quick Session Duration Fix - Implementation Guide

## TL;DR - The Problem

Sessions aren't being ended properly before checkout redirect, so:
- ❌ No active/idle time tracking
- ❌ Session duration = timestamp diff (includes Whop time)
- ❌ No abandoned checkout tracking
- ❌ Sessions not linked pre/post purchase

## The Solution (3 Files to Update)

### 1️⃣ Update Buy Button (CRITICAL)

**File:** `src/components/buy-button.tsx`

**Change the `onClick` function:**

```typescript
async function onClick() {
  // Get the anonymous ID from localStorage to pass to Whop
  let anonymousId = "";
  let sessionId = "";
  
  if (typeof window !== "undefined") {
    anonymousId = localStorage.getItem("aurea_anonymous_id") || "";
    sessionId = sessionStorage.getItem("aurea_session_id") || "";
  }

  // ✅ CRITICAL FIX: End session BEFORE redirect
  if (typeof window !== 'undefined' && (window as any).aureaSDK) {
    try {
      // End the current session (sends active/idle time)
      console.log("[TTR] Ending session before checkout...");
      await (window as any).aureaSDK.endSession();
      
      // Track buy button click
      (window as any).aureaSDK.trackEvent("buy_button_clicked", {
        location: window.location.pathname,
        product: "TTR Membership",
        sessionId,
      });
      
      // Mark checkout as started
      (window as any).aureaSDK.checkoutStarted({
        productId: "ttr_membership",
        productName: "TTR VIP Access",
        price: 99,
        currency: "USD",
        variant: "lifetime"
      });
      
      // Store checkout start time
      sessionStorage.setItem('checkout_started_at', Date.now().toString());
      
      // ✅ CRITICAL: Wait for events to be sent
      await new Promise(resolve => setTimeout(resolve, 400));
      
      console.log("[TTR] Session ended successfully");
    } catch (error) {
      console.error("[TTR] Error ending session:", error);
      // Continue with redirect even if tracking fails
    }
  }

  // Build checkout URL
  const checkoutUrl = new URL(whopUrl);
  if (anonymousId) {
    checkoutUrl.searchParams.set("aurea_id", anonymousId);
  }
  
  // ✅ NEW: Add session_id to return URL
  const returnUrl = new URL(window.location.origin + "/thank-you");
  returnUrl.searchParams.set("from_checkout", "true");
  returnUrl.searchParams.set("session_id", sessionId); // ✅ For session linking
  returnUrl.searchParams.set("purchased", "true");
  checkoutUrl.searchParams.set("return_url", returnUrl.toString());

  // Fire-and-forget event tracking
  fetch("/api/events/initiate-checkout", { method: "POST" }).catch(() => {});
  
  // Redirect to Whop
  window.location.href = checkoutUrl.toString();
}
```

**Key Changes:**
1. Call `aureaSDK.endSession()` - This sends the `session_end` event with active/idle time
2. Wait 400ms for events to be sent
3. Pass `session_id` to thank-you page for linking

---

### 2️⃣ Update Thank You Page

**File:** `src/app/thank-you/page.tsx`

**Update the `useEffect`:**

```typescript
useEffect(() => {
  setMounted(true);

  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get("email");
  const userName = urlParams.get("name");
  const orderId = urlParams.get("order_id") || urlParams.get("transaction_id") || `order_${Date.now()}`;
  const fromCheckout = urlParams.get("from_checkout") === "true";
  const originalSessionId = urlParams.get("session_id"); // ✅ NEW

  // Use new SDK checkoutCompleted() method
  if (typeof window !== 'undefined' && (window as any).aureaSDK) {
    // Calculate checkout duration
    const checkoutStartTime = sessionStorage.getItem('checkout_started_at');
    const checkoutDuration = checkoutStartTime 
      ? Math.floor((Date.now() - parseInt(checkoutStartTime)) / 1000)
      : null;
    
    // ✅ UPDATED: Pass originalSessionId and checkoutDuration
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
      originalSessionId,  // ✅ NEW: Link to pre-checkout session
      checkoutDuration,   // ✅ NEW: Time spent on Whop
    });
    
    console.log("[TTR] Checkout completed with session linking");
    console.log("  Original Session:", originalSessionId);
    console.log("  Checkout Duration:", checkoutDuration, "seconds");
  } else {
    // ... existing fallback code
  }

  // ... rest of existing code
}, []);
```

**Key Changes:**
1. Extract `session_id` from URL params
2. Calculate `checkoutDuration` from sessionStorage timestamp
3. Pass both to `checkoutCompleted()`

---

### 3️⃣ Update Webhook (Optional but Recommended)

**File:** `src/app/api/webhooks/whop/route.ts`

**After the `identifyAureaUser()` call (around line 197), update the conversion tracking:**

```typescript
// Identify the user in Aurea (link anonymous → known user)
await identifyAureaUser();

// ✅ UPDATED: Track conversion with checkout duration
const revenueAmount = finalAmount || subtotal || 9900; // Fallback to $99 if no amount

// Calculate checkout duration from webhook metadata if available
const aureaCheckoutStartTime = data?.metadata?.checkout_started_at;
const checkoutDuration = aureaCheckoutStartTime 
  ? Math.floor((Date.now() - parseInt(aureaCheckoutStartTime)) / 1000)
  : null;

await trackAureaEvent("purchase", {
  conversionType: "purchase",
  revenue: revenueAmount / 100, // Convert cents to dollars
  currency: currency || "USD",
  orderId: data?.id || "",
  checkoutDuration, // ✅ NEW: Track time spent in checkout
});
```

---

## SDK Requirements

The Aurea Tracking SDK needs to have an `endSession()` method. Check if it exists:

```typescript
// In browser console on TTR site:
console.log(typeof window.aureaSDK?.endSession);
// Should output: "function"
```

If it doesn't exist, you need to update the SDK to version with this method, or add it:

```typescript
// In aurea-tracking-sdk/src/index.ts
async endSession(): Promise<void> {
  if (!this.sessionStartTime) return;
  
  const now = Date.now();
  const duration = Math.floor((now - this.sessionStartTime) / 1000);
  const activeTime = this.activeTimeTracker?.getActiveTime() || 0;
  const idleTime = duration - activeTime;
  const engagementRate = duration > 0 ? (activeTime / duration) * 100 : 0;
  
  // Send session_end event
  await this.trackEvent("session_end", {
    duration,
    activeTime,
    idleTime,
    engagementRate,
  });
  
  // Force immediate send (don't wait for batch)
  await this.flushEvents();
}
```

---

## Testing

### Test 1: Session Ends Before Checkout

1. Open browser console
2. Visit TTR: `http://localhost:3001`
3. Browse for 30 seconds
4. Click "Buy Now"
5. **Check console logs:**
   ```
   [TTR] Ending session before checkout...
   [Aurea SDK] Event tracked: session_end { duration: 30, activeTime: 28, ... }
   [TTR] Session ended successfully
   ```
6. **Check Aurea CRM:**
   - Session should have `durationSeconds: ~30`
   - Session should have `activeTimeSeconds: ~28`
   - Session should have `engagementRate: ~93%`

### Test 2: Session Linking

1. Complete purchase on Whop
2. Return to thank-you page
3. **Check console logs:**
   ```
   [TTR] Checkout completed with session linking
     Original Session: ses_abc123xyz
     Checkout Duration: 180 seconds
   ```
4. **Check Aurea CRM:**
   - Original session should have `checkoutStartedAt`
   - New session should have `linkedSessionId` pointing to original
   - New session should have `checkoutDuration: 180`

### Test 3: Abandoned Checkout (After Cron Job Setup)

1. Click Buy Now
2. Close Whop tab immediately
3. Wait 31 minutes
4. **Check Aurea CRM:**
   - Session should have `isAbandoned: true`
   - Session should have `abandonedAt` timestamp

---

## Quick Verification Checklist

After making these changes:

- [ ] `buy-button.tsx` calls `endSession()` before redirect
- [ ] `buy-button.tsx` waits 400ms before redirecting
- [ ] `buy-button.tsx` passes `session_id` to return URL
- [ ] `thank-you/page.tsx` extracts `session_id` from URL
- [ ] `thank-you/page.tsx` calculates `checkoutDuration`
- [ ] `thank-you/page.tsx` passes both to `checkoutCompleted()`
- [ ] SDK has `endSession()` method
- [ ] Test shows session_end event in console
- [ ] Test shows session has activeTime/idleTime in CRM

---

## Expected Improvement

**Before Fix:**
```
Session Duration: 5 min 30 sec
  (includes 3 min on Whop - WRONG!)
Active Time: null
Idle Time: null
Engagement Rate: null
```

**After Fix:**
```
Session Duration: 2 min 30 sec
  (only time on TTR - CORRECT!)
Active Time: 2 min 10 sec
Idle Time: 20 sec
Engagement Rate: 86.7%
Checkout Duration: 3 min
```

---

## If SDK Doesn't Have `endSession()`

Temporary workaround until SDK is updated:

```typescript
// In buy-button.tsx
if (typeof window !== 'undefined' && (window as any).aureaSDK) {
  // Manual session end tracking
  const sessionStartTime = sessionStorage.getItem('aurea_session_start');
  const duration = sessionStartTime 
    ? Math.floor((Date.now() - parseInt(sessionStartTime)) / 1000) 
    : 0;
  
  // Track manual session end
  (window as any).aureaSDK.trackEvent("session_end", {
    duration,
    activeTime: duration * 0.85, // Estimate 85% active
    idleTime: duration * 0.15,
    engagementRate: 85,
    manual: true,
  });
  
  // Wait for send
  await new Promise(resolve => setTimeout(resolve, 400));
}
```

This is less accurate but better than nothing until the SDK method is available.

---

## Next Steps

1. ✅ Make these 2-3 file changes
2. ✅ Test locally
3. ✅ Verify session_end events in console
4. ✅ Check Aurea CRM for session data
5. ✅ Deploy to production
6. 🔄 Set up abandoned checkout cron (see full doc)
7. 🔄 Update SDK if `endSession()` doesn't exist

This fix will immediately improve your session duration tracking accuracy! 🎯
