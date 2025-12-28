# Testing the Thank-You Page Flow in Development

## Quick Test (No Whop)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Visit the thank-you page directly:**
   ```
   http://localhost:3000/thank-you?from_checkout=true
   ```

3. **Check tracking events in browser console:**
   - Should see: `[Aurea SDK] Event tracked: checkout_return`
   - Should see: `[Aurea SDK] Event tracked: thank_you_page_viewed`

4. **Check Aurea CRM analytics:**
   - Go to your funnel analytics dashboard
   - Look for events from your test session

---

## Full Flow Test with ngrok (Simulates Real Whop)

### Step 1: Expose Local Server

```bash
# Start TTR dev server
npm run dev

# In a new terminal, start ngrok
ngrok http 3000
```

You'll get a public URL like: `https://abc123.ngrok.io`

### Step 2: Update Environment Variables Temporarily

Create `.env.local` if not exists:

```bash
# Your existing Aurea tracking config
NEXT_PUBLIC_AUREA_API_KEY=your_api_key
NEXT_PUBLIC_AUREA_FUNNEL_ID=your_funnel_id
NEXT_PUBLIC_AUREA_API_URL=http://localhost:3000/api

# Update Whop URL to include your ngrok URL as return
NEXT_PUBLIC_WHOP_CHECKOUT_URL=https://whop.com/your-product?return_url=https://abc123.ngrok.io/thank-you
```

### Step 3: Test the Buy Button

1. Visit your ngrok URL: `https://abc123.ngrok.io`
2. Click the Buy button
3. You'll be redirected to Whop checkout
4. Check the URL - should include `return_url` parameter
5. After "purchase" on Whop, you should be redirected back to `/thank-you`

---

## Manual Simulation (No Whop at All)

If you want to simulate the entire flow without actually using Whop:

### Create a Test Checkout Page

Create `/Users/abdul/Desktop/ttr/src/app/test-checkout/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TestCheckout() {
  useEffect(() => {
    // Get return URL from query params
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("return_url");
    console.log("Return URL:", returnUrl);
  }, []);

  const handleComplete = () => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("return_url");
    
    if (returnUrl) {
      // Simulate Whop redirecting back
      window.location.href = returnUrl;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Test Checkout Page</h1>
        <p className="mb-6 text-gray-400">This simulates Whop checkout</p>
        <Button onClick={handleComplete} variant="gradient">
          Complete Purchase (Simulate)
        </Button>
      </div>
    </div>
  );
}
```

### Update Whop URL in .env.local

```bash
NEXT_PUBLIC_WHOP_CHECKOUT_URL=http://localhost:3000/test-checkout
```

### Test the Flow

1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000`
3. Click Buy button
4. You'll go to test-checkout page
5. Click "Complete Purchase"
6. You'll be redirected to `/thank-you?from_checkout=true`

---

## Checking Analytics in Development

### 1. Check Browser Console

Open DevTools and look for:
```
[Aurea SDK] Event tracked: checkout_initiated
[Aurea SDK] Event tracked: checkout_exit
[Aurea SDK] Event tracked: checkout_return
[Aurea SDK] Event tracked: thank_you_page_viewed
```

### 2. Check Network Tab

- Filter by "track/events"
- Inspect the payload being sent
- Verify events include correct properties

### 3. Check Aurea CRM Dashboard

Even in development, events are sent to your Aurea CRM instance:

1. Go to: `http://localhost:3000` (Aurea CRM)
2. Navigate to: Funnels → [Your Funnel] → Analytics
3. Check Events tab for:
   - `checkout_initiated`
   - `checkout_exit`
   - `checkout_return`
   - `thank_you_page_viewed`
4. Check Sessions tab for:
   - Landing: `/`
   - Exit: `/thank-you`

### 4. Check localStorage

Open DevTools → Application → Local Storage:

```javascript
// Check stored values
localStorage.getItem('aurea_anonymous_id')
localStorage.getItem('aurea_user_display_names')
sessionStorage.getItem('aurea_session_id')
sessionStorage.getItem('conversion_tracked')
```

---

## Expected Results

### ✅ Successful Test Checklist

- [ ] Thank-you page loads and displays correctly
- [ ] Animations play smoothly (checkmark, fade-ins)
- [ ] Browser console shows tracking events
- [ ] Events appear in Aurea CRM analytics
- [ ] Session shows: Landing `/` → Exit `/thank-you`
- [ ] No console errors
- [ ] All buttons are clickable and track events

### 📊 Events Timeline

1. User lands on `/` → `page_view`
2. User clicks Buy → `checkout_initiated`, `checkout_exit`
3. User returns → `checkout_return`, `page_view` (for /thank-you), `thank_you_page_viewed`
4. User clicks buttons → `check_email_clicked`, etc.

---

## Troubleshooting

### Events not showing in Aurea CRM?

1. Check `.env.local` has correct API key and funnel ID
2. Verify Aurea CRM dev server is running
3. Check Network tab for failed requests
4. Ensure CORS is enabled on API endpoint

### Thank-you page not tracking events?

1. Check browser console for errors
2. Verify SDK is initialized (should see init log)
3. Check if `from_checkout=true` parameter is present
4. Verify tracking component is in layout

### Animations not working?

1. Check if framer-motion is installed: `npm list framer-motion`
2. Clear browser cache
3. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

---

## Tips for Testing

1. **Use incognito mode** - Prevents cached data from affecting tests
2. **Clear localStorage between tests** - Ensures clean state
3. **Use different browsers** - Test Safari, Chrome, Firefox
4. **Test mobile viewport** - Use DevTools device emulation
5. **Monitor network requests** - Ensure events are sent successfully

