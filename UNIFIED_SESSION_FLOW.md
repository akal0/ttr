# Unified Session Flow - Single Session from Landing to Purchase

## Overview

This document explains how TTR maintains **ONE continuous session** from when a user lands on the page all the way through to purchase completion via Whop webhook. The `anonymousId` persists throughout the entire journey, allowing Aurea CRM to link all events to a single session.

---

## 🎯 The Flow

```
1. User lands on TTR
   ↓ SDK initializes
   ↓ Creates: anonymousId: "abc123", sessionId: "session_xyz"
   
2. User browses the site
   ↓ All events tracked with SAME anonymousId
   ↓ video_started, scroll_depth, faq_opened, etc.
   
3. User clicks "Buy Now" button
   ↓ checkoutStarted() called (DOES NOT END SESSION)
   ↓ anonymousId & sessionId saved to localStorage
   ↓ Redirect to Whop with metadata:
   ↓   ?checkout_session_metadata[aurea_anonymous_id]=abc123
   ↓   &checkout_session_metadata[aurea_session_id]=session_xyz
   
4. User completes purchase on Whop
   ↓ Whop sends webhook with metadata
   ↓ Webhook receives anonymousId: "abc123"
   
5. Webhook tracks conversion
   ↓ checkout_completed event with SAME anonymousId
   ↓ session_end event to close the session
   ↓ Aurea links all events (landing → browse → checkout → purchase)
   
6. Result: ONE UNIFIED SESSION ✅
```

---

## 📁 Files Updated

### **1. TTR Buy Button** (`~/Desktop/ttr/src/components/buy-button.tsx`)

**What Changed:**
- ❌ **Removed:** `endSession()` call before redirect
- ✅ **Added:** Pass `anonymousId`, `sessionId`, and `checkout_started_at` to Whop via URL metadata
- ✅ **Kept:** `checkoutStarted()` call to save context to localStorage

**Key Code:**
```typescript
// ✅ DON'T end session - keep it alive for webhook linking
if (typeof window !== 'undefined' && (window as any).aureaSDK) {
  // Track buy button click
  (window as any).aureaSDK.trackEvent("buy_button_clicked", {
    location: window.location.pathname,
    product: "TTR Membership",
    sessionId,
    anonymousId,
  });
  
  // Mark checkout as started (saves context to localStorage)
  (window as any).aureaSDK.checkoutStarted({
    productId: "ttr_membership",
    productName: "TTR VIP Access",
    price: 99,
    currency: "USD",
    variant: "lifetime"
  });
}

// ✅ CRITICAL: Pass anonymousId via URL metadata
const checkoutUrl = new URL(whopUrl);
if (anonymousId) {
  checkoutUrl.searchParams.set("checkout_session_metadata[aurea_anonymous_id]", anonymousId);
  checkoutUrl.searchParams.set("checkout_session_metadata[aurea_session_id]", sessionId);
  checkoutUrl.searchParams.set("checkout_session_metadata[checkout_started_at]", Date.now().toString());
}

// Redirect to Whop (session continues in background)
window.location.href = checkoutUrl.toString();
```

---

### **2. Whop Webhook** (`~/Desktop/ttr/src/app/api/webhooks/whop/route.ts`)

**What Changed:**
- ✅ **Extract** `anonymousId` and `sessionId` from webhook metadata
- ✅ **Use SAME** `anonymousId` and `sessionId` when tracking events
- ✅ **Track** `session_end` event to properly close the session after purchase

**Key Code:**
```typescript
// ✅ Extract Aurea tracking data from Whop webhook metadata
const aureaAnonymousId = 
  data?.checkout_session?.metadata?.aurea_anonymous_id ||
  data?.metadata?.aurea_anonymous_id ||
  data?.metadata?.aurea_id;

const aureaSessionId = 
  data?.checkout_session?.metadata?.aurea_session_id ||
  data?.metadata?.aurea_session_id;
  
const checkoutStartedAt = 
  data?.checkout_session?.metadata?.checkout_started_at ||
  data?.metadata?.checkout_started_at;

// ✅ Track events with SAME anonymousId and sessionId
const trackAureaEvent = async (eventName: string, properties: Record<string, any>) => {
  const anonymousIdToUse = aureaAnonymousId || userId;
  const sessionIdToUse = aureaSessionId || aureaAnonymousId || userId;
  
  await fetch(`${process.env.NEXT_PUBLIC_AUREA_API_URL}/track/events`, {
    method: "POST",
    headers: {
      "X-Aurea-API-Key": process.env.NEXT_PUBLIC_AUREA_API_KEY || "",
      "X-Aurea-Funnel-ID": process.env.NEXT_PUBLIC_AUREA_FUNNEL_ID || "",
    },
    body: JSON.stringify({
      events: [{
        eventName,
        properties,
        context: {
          user: {
            anonymousId: anonymousIdToUse, // ✅ SAME from browsing
          },
          session: {
            sessionId: sessionIdToUse, // ✅ SAME from browsing
          },
        },
        timestamp: Date.now(),
      }],
    }),
  });
};

// When payment succeeds:
if (type === "payment.succeeded") {
  // ✅ Track conversion with same session
  await trackAureaEvent("checkout_completed", {
    conversionType: "purchase",
    revenue: revenueAmount / 100,
    currency: currency || "USD",
    orderId: data?.id || "",
    checkoutDuration,
    source: "whop_webhook",
    sessionEnd: true,
  });
  
  // ✅ End the session after successful purchase
  await trackAureaEvent("session_end", {
    converted: true,
    conversionType: "purchase",
    revenue: revenueAmount / 100,
    orderId: data?.id || "",
    duration: checkoutDuration || 0,
    source: "whop_webhook",
  });
}
```

---

## 🔑 Key Concepts

### **anonymousId** (Persists Across Sessions)
- Stored in **localStorage** (survives page reloads, tab closes)
- Generated once per browser/device
- Used to track returning visitors
- **Critical:** This is what links the browsing session to the webhook conversion

### **sessionId** (Unique Per Visit)
- Stored in **sessionStorage** (cleared when tab closes)
- Generated once per visit/tab
- Used to group events within a single browsing session
- **Critical:** This is what groups all events (page views, clicks, checkout) into one session

### **Session Continuity**
- **Before:** Session ended when user clicked "Buy Now" → Conversion was orphaned
- **After:** Session continues during checkout → Conversion is linked to browsing activity

---

## 🧪 Testing the Flow

### **1. Test Setup**

```bash
# Terminal 1: Run TTR
cd ~/Desktop/ttr
npm run dev

# Terminal 2: Run Aurea CRM
cd ~/Desktop/aurea-crm
npm run dev:all
```

### **2. Test Steps**

1. **Open TTR in incognito** (fresh session)
2. **Open DevTools Console** (to see logs)
3. **Browse the site:**
   - Scroll down → `scroll_depth_*` events
   - Watch video → `video_*` events
   - Open FAQ → `faq_opened` events
4. **Check localStorage:**
   ```javascript
   localStorage.getItem('aurea_anonymous_id')  // Should return: "1234567890_abc123"
   sessionStorage.getItem('aurea_session_id')  // Should return: "1234567890_xyz789"
   ```
5. **Click "Buy Now"**
   - Console should log: `[TTR] Tracking checkout initiation (session stays alive)...`
   - Console should log: `[TTR] Redirecting to Whop with anonymousId: 1234567890_abc123`
   - Should redirect to Whop with URL params
6. **Complete purchase on Whop** (use test mode)
7. **Check webhook logs:**
   ```
   🔗 Aurea tracking - anonymousId: 1234567890_abc123, sessionId: 1234567890_xyz789
   ✅ Tracked checkout_completed in Aurea with anonymousId: 1234567890_abc123
   ✅ Tracked session_end in Aurea
   ```
8. **Check Aurea CRM:**
   - Go to Funnels → TTR → Sessions
   - Find session with anonymousId `1234567890_abc123`
   - Should see ALL events in timeline:
     - page_view
     - scroll_depth_*
     - video_*
     - faq_opened
     - buy_button_clicked
     - checkout_started
     - checkout_completed ✅
     - session_end ✅

---

## 📊 Session Data in Aurea

### **What Aurea Sees:**

```json
{
  "sessionId": "1234567890_xyz789",
  "anonymousId": "1234567890_abc123",
  "events": [
    {
      "eventName": "page_view",
      "timestamp": 1703001000000
    },
    {
      "eventName": "scroll_depth_25",
      "timestamp": 1703001005000
    },
    {
      "eventName": "video_started",
      "timestamp": 1703001010000
    },
    {
      "eventName": "faq_opened",
      "timestamp": 1703001030000
    },
    {
      "eventName": "buy_button_clicked",
      "timestamp": 1703001050000
    },
    {
      "eventName": "checkout_started",
      "timestamp": 1703001051000
    },
    {
      "eventName": "checkout_completed",
      "timestamp": 1703001200000,  // ← From Whop webhook
      "properties": {
        "revenue": 99,
        "orderId": "whop_12345",
        "source": "whop_webhook",
        "sessionEnd": true
      }
    },
    {
      "eventName": "session_end",
      "timestamp": 1703001201000,  // ← From Whop webhook
      "properties": {
        "converted": true,
        "revenue": 99,
        "duration": 149  // Total checkout time in seconds
      }
    }
  ],
  "converted": true,
  "conversionValue": 99,
  "totalDuration": 201  // Total session duration (seconds)
}
```

---

## 🔄 Adapting for Other Payment Providers

This pattern works for **any payment provider** that supports custom metadata:

### **Stripe Checkout**

```typescript
// In buy-button.tsx
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  success_url: `${window.location.origin}/thank-you`,
  metadata: {
    aurea_anonymous_id: anonymousId,
    aurea_session_id: sessionId,
    checkout_started_at: Date.now().toString(),
  },
});

// In webhook handler
const session = event.data.object;
const aureaAnonymousId = session.metadata.aurea_anonymous_id;
const aureaSessionId = session.metadata.aurea_session_id;

// Track conversion with SAME session
await trackAureaEvent("checkout_completed", {
  ...
});
```

### **Polar (Subscription Payments)**

```typescript
// In buy-button.tsx
const checkoutUrl = new URL(polarCheckoutUrl);
checkoutUrl.searchParams.set("metadata[aurea_anonymous_id]", anonymousId);
checkoutUrl.searchParams.set("metadata[aurea_session_id]", sessionId);

// In webhook handler
const aureaAnonymousId = data.metadata.aurea_anonymous_id;
const aureaSessionId = data.metadata.aurea_session_id;
```

### **Shopify**

```typescript
// In buy-button.tsx
const checkout = await shopify.checkout.create({
  line_items: [...],
  note_attributes: [
    { name: "aurea_anonymous_id", value: anonymousId },
    { name: "aurea_session_id", value: sessionId },
  ],
});

// In webhook handler
const noteAttributes = data.note_attributes;
const aureaAnonymousId = noteAttributes.find(attr => 
  attr.name === "aurea_anonymous_id"
)?.value;
```

---

## ✅ Benefits of Unified Sessions

1. **Attribution Accuracy**
   - Know exactly which events led to a conversion
   - See the full customer journey in one timeline

2. **Better Analytics**
   - Calculate time-to-convert
   - Identify high-value engagement patterns
   - Track micro-conversions that predict purchase

3. **Workflow Automation**
   - Trigger workflows based on browsing behavior + purchase
   - Segment customers by engagement level
   - Personalize post-purchase communication

4. **Revenue Tracking**
   - Link revenue to specific traffic sources
   - Calculate ROI per campaign
   - Track conversion rate by UTM parameters

---

## 🚨 Important Notes

### **Session Does NOT End On Checkout Click**
- The session stays **alive** during the external checkout
- This allows the webhook to link the conversion back to the original session
- Session only ends when:
  - Webhook fires `session_end` event (successful purchase)
  - User closes the tab (browser `beforeunload` event)
  - User is inactive for 30+ minutes

### **anonymousId vs sessionId**
- **anonymousId:** Persists across visits (tracks returning users)
- **sessionId:** Unique per visit (groups events in one browsing session)
- Both are passed to webhooks to ensure proper linking

### **Checkout Duration Calculation**
- Starts when user clicks "Buy Now"
- Ends when webhook fires (payment succeeded)
- Stored in session metadata for analytics

---

## 📚 Related Documentation

- **SDK Architecture:** `~/Desktop/aurea-tracking-sdk/README.md`
- **TTR Integration:** `~/Desktop/ttr/TTR_INTEGRATION_GUIDE.md`
- **Event Catalog:** `~/Desktop/ttr/ALL_EVENTS_DOCUMENTED.md`
- **Aurea Session Processing:** `~/Desktop/aurea-crm/src/inngest/functions/process-tracking-events.ts`

---

## 🎉 Summary

**Before:**
- ❌ Session ended when user clicked "Buy Now"
- ❌ Conversion was disconnected from browsing activity
- ❌ Lost attribution data

**After:**
- ✅ Session continues through checkout
- ✅ Conversion is linked to browsing activity
- ✅ Full customer journey tracked in ONE session
- ✅ Works with any payment provider (Whop, Stripe, Polar, Shopify, etc.)

**Result:** Complete visibility into the customer journey from first touch to purchase! 🚀
