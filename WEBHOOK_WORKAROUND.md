# Webhook Workaround for Development

## The Problem
In development, Whop doesn't have a return URL configured, so users don't automatically get redirected to the thank-you page after purchase.

## Solution Options

### Option 1: Manual Redirect (Simplest for Testing)

When you test a purchase in development and the webhook fires:

1. **Check your browser console** - you should see Aurea tracking events
2. **Manually visit**: `http://localhost:3001/thank-you?from_checkout=true`
3. This simulates the user returning from Whop

### Option 2: Auto-Redirect via SDK (Automatic)

I've updated the SDK to automatically detect purchases and redirect users.

**How it works:**
1. When webhook fires with a purchase, it tracks the event in Aurea
2. User's anonymousId is used to match the purchase
3. Next time user visits ANY page on the site, SDK detects purchase
4. SDK auto-redirects to thank-you page

**To test:**
1. Make a test purchase (or simulate webhook)
2. Close the browser tab
3. Visit `http://localhost:3001` in the same browser
4. SDK should auto-redirect to `/thank-you`

### Option 3: Email with Link (Production Ready)

Add a link in the welcome email that goes to:
```
https://yourdomain.com/thank-you?from_checkout=true
```

Users click the link in their welcome email and see the thank-you page.

---

## Best Practice for Production

### Configure Whop Success URL

In your Whop dashboard:
1. Go to Product Settings
2. Find "Success URL" or "Redirect URL" setting
3. Set it to: `https://yourdomain.com/thank-you`

Whop will automatically redirect users there after purchase.

---

## Testing the Full Flow in Dev

### Using the Purchase Redirect Endpoint

I created an endpoint that sets a localStorage flag and redirects:

```
http://localhost:3001/api/purchase-redirect
```

**Manual Test:**
1. Visit homepage: `http://localhost:3001`
2. In a new tab, visit: `http://localhost:3001/api/purchase-redirect`
3. You'll be redirected to thank-you page
4. Close tab and go back to homepage
5. Refresh - SDK should detect purchase and redirect again

### Simulating Webhook Purchase

You can manually trigger the localStorage flag:

```javascript
// In browser console:
localStorage.setItem('aurea_just_purchased', 'true');
// Refresh page - you'll be redirected to /thank-you
```

---

## Current Flow in Development

### With Webhook Only (No Return URL)

1. User clicks Buy → Goes to Whop
2. User completes purchase → Webhook fires ✅
3. Webhook tracks purchase in Aurea ✅
4. User stays on Whop OR closes tab
5. User manually returns to site later
6. SDK detects purchase flag → Auto-redirects to /thank-you ✅

### Expected Behavior

**First visit after purchase:**
- User lands on `/` 
- SDK detects `aurea_just_purchased` flag
- Auto-redirects to `/thank-you?from_checkout=true`
- Flag is cleared
- Session shows: Landing `/` → Exit `/thank-you` ✅

**Subsequent visits:**
- No redirect (flag was cleared)
- Normal browsing

---

## Verifying It Works

### Test Steps

1. **Set the flag manually:**
   ```javascript
   localStorage.setItem('aurea_just_purchased', 'true');
   ```

2. **Visit homepage:**
   ```
   http://localhost:3001
   ```

3. **Check console:**
   ```
   [Aurea SDK] Purchase detected, redirecting to thank-you page...
   ```

4. **Should redirect to:**
   ```
   http://localhost:3001/thank-you?from_checkout=true
   ```

5. **Flag should be cleared:**
   ```javascript
   localStorage.getItem('aurea_just_purchased') // null
   ```

---

## For Production

### Recommended Setup

1. **Configure Whop Success URL:**
   - Set to: `https://yourdomain.com/thank-you`
   - Users get immediate redirect after purchase

2. **Keep SDK Auto-Redirect:**
   - Catches users who close browser after purchase
   - Works even if Whop redirect fails

3. **Add Email Link:**
   - Include thank-you page link in welcome email
   - Third fallback for users to access page

This triple-redundancy ensures users always find the thank-you page! ✅

