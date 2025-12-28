# Debug Redirect Issue

## Step 1: Check Browser Console

Visit `http://localhost:3001` and open DevTools Console.

Look for these logs:
```
[Aurea SDK] Initialized
[Aurea SDK] Purchase check failed: ...
```

## Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by: `check-purchase`
3. You should see GET requests every 3 seconds
4. Click on one to see the response

**What to check:**
- Is the request being made? (should see every 3 seconds)
- What's the response? Should be `{ "hasPurchased": false }`
- What's the anonymousId parameter in the URL?

## Step 3: Check Server Logs

When webhook fires, check terminal logs for:
```
✅ Marked user <anonymousId> for redirect to thank-you page
✅ Marked <anonymousId> as purchased
```

## Step 4: Manual Test

**In browser console, check your anonymousId:**
```javascript
localStorage.getItem('aurea_anonymous_id')
```

**Copy that ID and test the endpoint directly:**
```bash
# Replace YOUR_ANON_ID with the value from above
curl "http://localhost:3001/api/check-purchase?anonymousId=YOUR_ANON_ID"
```

Should return: `{"hasPurchased":false}` or `{"hasPurchased":true}`

## Step 5: Simulate Purchase

**In browser console:**
```javascript
// Check current anonymousId
const anonId = localStorage.getItem('aurea_anonymous_id');
console.log('My anonymousId:', anonId);

// Simulate webhook marking you as purchased
fetch('http://localhost:3001/api/check-purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    anonymousId: anonId,
    secret: 'dev-secret-change-in-production'
  })
}).then(r => r.json()).then(console.log);

// Wait 3 seconds, should auto-redirect!
```

## Common Issues

### Issue 1: Polling Not Starting

**Check console for:**
```
[Aurea SDK] Initialized
```

If you don't see this, the SDK isn't loading.

**Fix:** Check that `<AureaTracking />` component is in your layout.

### Issue 2: Wrong anonymousId

**Problem:** Webhook uses different ID than browser

**Check webhook logs for:**
```
🔗 Aurea tracking ID: <some-id>
```

**Compare with browser:**
```javascript
localStorage.getItem('aurea_anonymous_id')
```

If they're different, that's the problem!

**Why this happens:**
- User cleared localStorage between buying and returning
- Different browser/device
- Incognito mode

### Issue 3: Polling Errors

**Check Network tab for failed requests**

Common causes:
- Server not running
- Wrong port (should be 3001)
- CORS issues

### Issue 4: Server Not Marking Purchase

**Check terminal logs when webhook fires:**

Should see:
```
✅ Marked user abc123 for redirect to thank-you page
✅ Marked abc123 as purchased
```

If you don't see this, the webhook isn't calling the endpoint.

**Check webhook code at line ~145:**
```typescript
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-purchase`, ...)
```

Is `NEXT_PUBLIC_APP_URL` set correctly?

## Quick Debug Script

**Paste this in browser console:**
```javascript
// Full debug check
(async () => {
  const anonId = localStorage.getItem('aurea_anonymous_id');
  console.log('1. My anonymousId:', anonId);
  
  console.log('2. Checking if marked as purchased...');
  const checkRes = await fetch(`/api/check-purchase?anonymousId=${anonId}`);
  const checkData = await checkRes.json();
  console.log('   Result:', checkData);
  
  if (!checkData.hasPurchased) {
    console.log('3. Not marked yet. Marking now...');
    const markRes = await fetch('/api/check-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: anonId,
        secret: 'dev-secret-change-in-production'
      })
    });
    const markData = await markRes.json();
    console.log('   Marked:', markData);
    console.log('4. Wait 3 seconds for redirect...');
  } else {
    console.log('3. Already marked! Should redirect within 3 seconds...');
  }
})();
```

## Expected Flow

**After running debug script, you should see:**
```
1. My anonymousId: 1234567890_abc123
2. Checking if marked as purchased...
   Result: { hasPurchased: false }
3. Not marked yet. Marking now...
   Marked: { success: true }
4. Wait 3 seconds for redirect...
[Aurea SDK] Purchase detected! Redirecting to thank-you page...
```

Then page redirects to `/thank-you?from_checkout=true`

## Still Not Working?

**Restart the dev server:**
```bash
# Stop with Ctrl+C
cd /Users/abdul/Desktop/ttr
npm run dev
```

The new env variable needs the server to restart!

