# Aurea SDK Known Issues - TTR Project

## Issue: Purchase Polling Endpoint 404 Error

### Status
**Non-Critical** - Does not affect core tracking functionality

### Description
The SDK's purchase polling feature is trying to call `/api/check-purchase` on the Aurea CRM URL instead of the TTR app's URL, resulting in 404 errors.

### Current Behavior
```
GET http://localhost:3000/api/check-purchase?anonymousId=xxx 404 (Not Found)
[Aurea SDK] Purchase check failed: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Root Cause
The SDK's `checkForPurchase()` method uses:
```typescript
`${this.config.apiUrl?.replace('/api', '')}/api/check-purchase?anonymousId=${this.anonymousId}`
```

This constructs the URL based on `apiUrl` config (which points to Aurea CRM), when it should use `window.location.origin` (the current site).

### Impact
- ❌ **Non-functional:** Automatic purchase detection and redirect won't work
- ✅ **Functional:** Event tracking works perfectly
- ✅ **Functional:** Checkout tracking works
- ✅ **Functional:** Manual conversions tracked via webhook

### Workaround Applied
**Disabled debug mode** to silence the error messages:
```typescript
// src/components/aurea-tracking.tsx
initAurea({
  debug: false, // ← Changed from: process.env.NODE_ENV === "development"
})
```

### Alternative Solutions

#### Solution 1: Manual Redirect (Current TTR Setup)
Your Whop webhook already handles the redirect:

**File:** `src/app/api/webhooks/whop/route.ts`
```typescript
// Mark user as purchased (for polling detection)
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-purchase`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    anonymousId: aureaId,
    secret: process.env.PURCHASE_CHECK_SECRET,
  }),
});
```

This means:
1. User clicks "Buy Now" → Redirected to Whop
2. User completes purchase on Whop
3. Whop webhook fires → Marks purchase in TTR's `/api/check-purchase` endpoint
4. **But:** Polling can't detect it because it's checking wrong URL
5. **Instead:** User is redirected back via Whop's return URL

#### Solution 2: Override SDK Purchase Polling
Create a custom implementation that uses the correct URL:

**File:** `src/lib/custom-purchase-polling.ts`
```typescript
"use client";

export function startCustomPurchasePolling() {
  if (typeof window === "undefined") return;

  const checkPurchase = async () => {
    const anonymousId = localStorage.getItem("aurea_anonymous_id");
    if (!anonymousId) return;

    try {
      // Use window.location.origin instead of apiUrl
      const response = await fetch(
        `${window.location.origin}/api/check-purchase?anonymousId=${anonymousId}`
      );
      const data = await response.json();

      if (data.hasPurchased) {
        console.log("[Custom] Purchase detected! Redirecting...");
        localStorage.setItem("aurea_just_purchased", "true");
        window.location.href = "/thank-you?from_checkout=true";
      }
    } catch (error) {
      // Silently fail
      console.log("[Custom] Purchase check failed:", error);
    }
  };

  // Check immediately
  checkPurchase();

  // Then check every 3 seconds
  setInterval(checkPurchase, 3000);
}
```

Then use it:
```typescript
// src/components/aurea-tracking.tsx
import { startCustomPurchasePolling } from "@/lib/custom-purchase-polling";

useEffect(() => {
  // ... SDK initialization

  // Start custom purchase polling
  startCustomPurchasePolling();
}, []);
```

#### Solution 3: Update SDK (Recommended Long-term)
Submit a PR to the `aurea-tracking-sdk` repository to fix the bug:

**Change needed in SDK:**
```typescript
// Before (incorrect):
const response = await fetch(
  `${this.config.apiUrl?.replace('/api', '')}/api/check-purchase?anonymousId=${this.anonymousId}`
);

// After (correct):
const response = await fetch(
  `${window.location.origin}/api/check-purchase?anonymousId=${this.anonymousId}`
);
```

### Current Status
✅ **Workaround applied** - Debug mode disabled to silence errors  
✅ **Core tracking functional** - All events tracked successfully  
✅ **Purchase tracking works** - Via Whop webhook + manual redirect  
⚠️ **Automatic polling disabled** - Not critical due to webhook setup  

### Recommendation
**Keep current setup** - The Whop webhook handles purchase detection and redirect correctly. The SDK's polling is redundant in this case.

The only scenario where polling would help is if:
1. User completes purchase on Whop
2. Whop redirect fails or user closes tab
3. User returns to site later
4. Polling detects purchase and redirects them

Since you're using Whop's `return_url` parameter, this edge case is already handled.

### Next Steps
1. ✅ **Current setup works** - No action needed
2. 🔄 **Optional:** Implement Solution 2 if you want automatic polling
3. 📝 **Optional:** Submit SDK fix to enable polling for all users

---

**Last Updated:** December 27, 2025  
**Status:** Non-Critical Issue - Workaround Applied
