# Solution: Matching Users Between Client-Side Tracking and Whop Webhooks

## Problem
- **Client-side SDK** uses `anonymousId` (localStorage)  
- **Whop webhooks** use `user.id` or `email`  
- These don't match, so purchase events appear as different users

## Solution: Use Email as the Primary Identifier

### Step 1: Update Buy Button (✅ DONE)
Pass the `anonymousId` through Whop checkout URL:
```typescript
// In buy-button.tsx
const checkoutUrl = new URL(whopUrl);
checkoutUrl.searchParams.set("aurea_id", anonymousId);
```

### Step 2: Store Mapping in Database
When user initiates checkout, store the mapping:
```
anonymousId → pending purchase
```

### Step 3: Update Webhook to Use AnonymousId (✅ DONE)
Extract `aurea_id` from webhook metadata and use it:
```typescript
const aureaAnonymousId = data?.metadata?.aurea_id;
context: {
  user: {
    anonymousId: aureaAnonymousId, // Same as client-side!
  }
}
```

## Alternative Simpler Solution (RECOMMENDED)

Since Whop might not pass URL params to webhook metadata, use this approach:

### When user clicks Buy Button:
1. Get their current `anonymousId` from localStorage
2. Store in sessionStorage: `pendingCheckout = { anonymousId, timestamp }`
3. Also send to your backend API: `POST /api/checkout/init`

### In your backend:
4. Create a Redis/Database entry: `whopUserId → anonymousId` (or use email as key)

### When Whop webhook arrives:
5. Look up the user by email in your database
6. Get their `anonymousId` from the mapping
7. Use that `anonymousId` in the Aurea tracking event

## Quick Fix for Now

Update the webhook to simply use the **email** as both `userId` AND `anonymousId`:

```typescript
context: {
  user: {
    userId: email,
    anonymousId: email, // Same identifier!
  }
}
```

And update client-side to also identify with email when available.
