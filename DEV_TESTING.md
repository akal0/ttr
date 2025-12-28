# 🧪 Development Testing Guide - Quick Start

## Fastest Way to Test (5 minutes)

### 1. Start the Dev Server

```bash
cd /Users/abdul/Desktop/ttr
npm run dev
```

The app will be available at: `http://localhost:3000`

---

### 2. Test the Thank-You Page Directly

Open in your browser:
```
http://localhost:3000/thank-you?from_checkout=true
```

**✅ What to check:**
- Page loads with animations
- Console shows: `[Aurea SDK] Event tracked: thank_you_page_viewed`
- No errors in console

---

### 3. Test the Complete Flow (Without Whop)

#### Step A: Update Environment Variable

Create or edit `/Users/abdul/Desktop/ttr/.env.local`:

```bash
# Point to test checkout instead of real Whop
NEXT_PUBLIC_WHOP_CHECKOUT_URL=http://localhost:3000/test-checkout
```

#### Step B: Restart the server

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

#### Step C: Test the flow

1. Go to: `http://localhost:3000`
2. Click the "Buy" button (anywhere on homepage)
3. You'll be redirected to: `http://localhost:3000/test-checkout`
4. Click "Complete Purchase (Test)"
5. You'll be redirected to: `http://localhost:3000/thank-you?from_checkout=true`

**✅ What to check in console:**
```
[Aurea SDK] Event tracked: checkout_initiated
[Aurea SDK] Event tracked: checkout_exit
Test Checkout Loaded:
- Return URL: http://localhost:3000/thank-you?from_checkout=true
- Aurea ID: <your anonymous id>
Redirecting to: http://localhost:3000/thank-you?from_checkout=true
[Aurea SDK] Event tracked: checkout_return
[Aurea SDK] Event tracked: thank_you_page_viewed
```

---

### 4. Check Analytics in Aurea CRM

While TTR is running, also start Aurea CRM:

```bash
# In a new terminal
cd /Users/abdul/Desktop/aurea-crm
npm run dev:all
```

Then:
1. Go to Aurea CRM: `http://localhost:3000` (different port if TTR is on 3000)
2. Navigate to: **Funnels → [TTR Funnel] → Analytics**
3. Check **Events** tab for your test events
4. Check **Sessions** tab - should show:
   - **Landing**: `/`
   - **Exit**: `/thank-you`

---

## Visual Checklist

### Thank-You Page Should Have:
- ✅ Animated green checkmark (bounces in)
- ✅ "Welcome to the Room! 🎉" heading
- ✅ "What Happens Next" section with 3 steps
- ✅ 3 benefit cards (Community, Signals, Lifetime)
- ✅ "Check Your Email" button (blue gradient)
- ✅ "Back to Home" button (outlined)
- ✅ Support email link at bottom

### Test Checkout Page Should Have:
- ✅ Purple card icon
- ✅ "Test Checkout Page" heading
- ✅ Return URL display (blue)
- ✅ Aurea ID display (green)
- ✅ Product info card ($99)
- ✅ "Complete Purchase" button (enabled when return URL exists)

---

## Quick Debugging

### Events not tracking?
```javascript
// Check in browser console:
window.aurea // Should be defined
localStorage.getItem('aurea_anonymous_id') // Should have a value
sessionStorage.getItem('aurea_session_id') // Should have a value
```

### Can't see the buy button?
- It's in the Hero section of the homepage
- Scroll to find it or check Hero component
- Look for buttons with gradient styling

### Return URL not working?
- Check `.env.local` has `NEXT_PUBLIC_WHOP_CHECKOUT_URL` set
- Restart dev server after changing env vars
- Clear browser cache

---

## After Testing in Dev

Once you're happy with the flow, you can:

1. **Switch back to real Whop URL:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_WHOP_CHECKOUT_URL=https://whop.com/your-actual-product
   ```

2. **Configure Whop to use your thank-you page:**
   - In Whop dashboard, set success URL to: `https://yourdomain.com/thank-you`
   - Or rely on the `return_url` parameter we're passing

3. **Deploy to production** when ready

---

## Need Help?

Common issues and solutions in: `TESTING_GUIDE.md`

