# Webhook → Client Redirect System

## How It Works

This system connects server-side webhooks to client-side redirects, solving the problem of redirecting users to the thank-you page when Whop doesn't provide a return URL.

### The Flow

```
1. User clicks Buy → Goes to Whop checkout
2. User completes purchase on Whop
3. Whop sends webhook to your server ✅
4. Webhook extracts aurea_id (anonymousId)
5. Webhook calls /api/check-purchase (POST) to mark user ✅
6. User's browser is polling /api/check-purchase (GET) every 3 seconds
7. Browser detects purchase → Redirects to /thank-you ✅
8. Session shows: Landing / → Exit /thank-you ✅
```

---

## Components

### 1. Webhook Handler (`/api/webhooks/whop/route.ts`)

When `payment.succeeded` fires:
```typescript
// Extract Aurea anonymous ID from checkout metadata
const aureaAnonymousId = data?.metadata?.aurea_id;

// Mark user as purchased
await fetch('/api/check-purchase', {
  method: "POST",
  body: JSON.stringify({
    anonymousId: aureaAnonymousId,
    secret: process.env.PURCHASE_CHECK_SECRET,
  }),
});
```

### 2. Purchase Check API (`/api/check-purchase/route.ts`)

**POST endpoint** - Called by webhook:
- Stores anonymousId in memory map
- Marks user as "just purchased"
- Protected by secret key

**GET endpoint** - Polled by client:
- Checks if anonymousId has purchased
- Returns `{ hasPurchased: true/false }`
- Removes from map after returning true (one-time)

### 3. Aurea SDK (`/lib/aurea-tracking.ts`)

**Purchase Polling:**
```typescript
// Polls every 3 seconds
setInterval(() => {
  fetch(`/api/check-purchase?anonymousId=${anonymousId}`)
    .then(res => res.json())
    .then(data => {
      if (data.hasPurchased) {
        // Redirect to thank-you page
        window.location.href = '/thank-you?from_checkout=true';
      }
    });
}, 3000);
```

---

## Setup

### 1. Add Environment Variables

In `/Users/abdul/Desktop/ttr/.env.local`:

```bash
# App URL (for webhook to call check-purchase endpoint)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Secret key to protect the endpoint
PURCHASE_CHECK_SECRET=your-secret-key-here-change-in-production
```

### 2. Restart Server

The system is already integrated! Just restart:
```bash
cd /Users/abdul/Desktop/ttr
npm run dev
```

---

## Testing

### Test 1: Simulate Webhook (Quick)

**In terminal, simulate webhook call:**
```bash
curl -X POST http://localhost:3001/api/check-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "anonymousId": "test-user-123",
    "secret": "your-secret-key-here"
  }'
```

**In browser:**
1. Visit: `http://localhost:3001`
2. Open console, run:
   ```javascript
   localStorage.setItem('aurea_anonymous_id', 'test-user-123');
   ```
3. Refresh page
4. Within 3 seconds, should auto-redirect to `/thank-you`!

### Test 2: Full Whop Flow

1. **Add aurea_id to checkout:**
   - Buy button already does this (see `buy-button.tsx`)
   - Whop stores it in `checkout_session.metadata.aurea_id`

2. **Complete purchase on Whop**
   - Webhook fires with metadata

3. **Browser polling detects purchase**
   - User redirected automatically!

### Test 3: Check Polling in Console

Visit `http://localhost:3001` and watch Network tab:
- Should see GET requests to `/api/check-purchase` every 3 seconds
- Request includes your `anonymousId` parameter

---

## Security

### Protection Against Abuse

1. **Secret Key:** POST endpoint requires `PURCHASE_CHECK_SECRET`
2. **One-Time Use:** Purchase flag removed after first check
3. **Time Limit:** Purchases expire after 1 hour
4. **Memory Only:** No database writes (uses in-memory Map)

### Production Considerations

For production, consider:
1. **Use Redis** instead of memory Map (survives restarts)
2. **Rate limiting** on GET endpoint (prevent polling spam)
3. **Strong secret** for POST endpoint
4. **HTTPS only** for webhook calls

---

## How Polling Works

### Client-Side Polling Loop

**Starts on page load:**
```typescript
// Check immediately
checkForPurchase();

// Then check every 3 seconds
setInterval(() => {
  checkForPurchase();
}, 3000);
```

**Makes GET request:**
```
GET /api/check-purchase?anonymousId=1234567890_abc123
```

**Server responds:**
```json
{ "hasPurchased": false }  // Keep polling
// OR
{ "hasPurchased": true }   // Redirect now!
```

### Why Every 3 Seconds?

- Fast enough to feel instant (3-6 second delay max)
- Slow enough to not spam server
- Balances UX and performance

---

## Debugging

### Check if polling is working

**Browser console:**
```javascript
// Should see polling requests in Network tab
// Filter by: check-purchase
```

### Check if webhook marked user

**Server logs should show:**
```
✅ Marked abc123_xyz789 for redirect to thank-you page
✅ Marked abc123_xyz789 as purchased
```

### Manually trigger redirect

**Browser console:**
```javascript
// Simulate purchase detection
fetch('/api/check-purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    anonymousId: localStorage.getItem('aurea_anonymous_id'),
    secret: 'your-secret-key'
  })
});

// Wait 3 seconds, should auto-redirect!
```

---

## Advantages

✅ **Works without Whop return URL** - No configuration needed in Whop dashboard  
✅ **Automatic detection** - User doesn't need to click anything  
✅ **Reliable** - Polling continues until purchase detected  
✅ **Secure** - Protected by secret key  
✅ **Simple** - No complex websockets or SSE  

---

## Fallbacks

If polling fails, users can still:

1. **Manual redirect:** Visit `/thank-you` directly
2. **Email link:** Click link in welcome email
3. **Whop redirect:** Configure in production (primary method)

This system is a **development tool** and **production fallback**, not the primary redirect method.

---

## Production Setup

### Recommended Configuration

1. **Primary:** Configure Whop success URL → `/thank-you`
2. **Fallback:** Keep polling system (this system)
3. **Tertiary:** Email link in welcome message

This triple-redundancy ensures users always reach the thank-you page!

---

## Files Reference

```
src/app/api/check-purchase/route.ts  ← Purchase check endpoint
src/app/api/webhooks/whop/route.ts   ← Webhook handler
src/lib/aurea-tracking.ts            ← SDK with polling
src/components/buy-button.tsx        ← Adds aurea_id to checkout
```

---

## Next Steps

1. ✅ Add `PURCHASE_CHECK_SECRET` to `.env.local`
2. ✅ Restart dev server
3. ✅ Test with curl command above
4. ✅ Verify polling in browser Network tab
5. 🚀 Ready for testing with real Whop webhooks!

