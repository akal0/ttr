# 🧪 Testing Purchase Flow in Development

## Quick Test (30 seconds)

### Step 1: Open Browser Console
1. Visit: `http://localhost:3001`
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab

### Step 2: Simulate Purchase
Paste this in console:
```javascript
localStorage.setItem('aurea_just_purchased', 'true');
console.log('✅ Purchase flag set!');
```

### Step 3: Refresh Page
Press `Cmd+R` (Mac) or `Ctrl+R` (Windows)

### Step 4: Watch the Magic ✨
You should see:
1. Console log: `[Aurea SDK] Purchase detected, redirecting to thank-you page...`
2. Automatic redirect to `/thank-you?from_checkout=true`
3. Beautiful thank-you page loads
4. Console shows tracking events

### Step 5: Verify Flag Cleared
In console, type:
```javascript
localStorage.getItem('aurea_just_purchased')
```
Should return: `null` ✅

---

## Alternative: Use the Redirect Endpoint

### Visit this URL:
```
http://localhost:3001/api/purchase-redirect
```

This will:
1. Show a loading screen
2. Set the purchase flag
3. Auto-redirect to thank-you page

---

## Full Flow Test (With Test Checkout)

### 1. Update .env.local
Make sure you have:
```bash
NEXT_PUBLIC_WHOP_CHECKOUT_URL=http://localhost:3001/test-checkout
```

### 2. Restart Server
```bash
# Stop with Ctrl+C, then:
npm run dev
```

### 3. Test Complete Flow
1. Go to: `http://localhost:3001`
2. Click any "Buy" button
3. On test-checkout page, click "Complete Purchase"
4. Should redirect to thank-you page ✅

---

## What to Check

### ✅ Success Indicators

**Console logs you should see:**
```
[Aurea SDK] Initialized
[Aurea SDK] Event tracked: checkout_initiated
[Aurea SDK] Event tracked: checkout_exit
[Aurea SDK] Event tracked: checkout_return
[Aurea SDK] Event tracked: thank_you_page_viewed
```

**Page behavior:**
- Smooth redirect (no flash/flicker)
- Thank-you page loads with animations
- Checkmark bounces in
- All content displays properly

**Analytics (check in Aurea CRM):**
- Events appear in Events tab
- Session shows: Landing `/` → Exit `/thank-you`
- User names persist

---

## Troubleshooting

### Redirect not working?

**Check 1: Is flag set?**
```javascript
localStorage.getItem('aurea_just_purchased')
// Should be 'true' before redirect
```

**Check 2: Is SDK initialized?**
```javascript
window.aurea
// Should be defined
```

**Check 3: Check console for errors**
Look for any red errors in console

### Still on homepage after refresh?

**Clear localStorage and try again:**
```javascript
localStorage.clear();
localStorage.setItem('aurea_just_purchased', 'true');
location.reload();
```

### Thank-you page 404?

**Restart the dev server:**
```bash
# Stop with Ctrl+C
npm run dev
```

---

## Simulating Real Purchase (Advanced)

To simulate what happens when Whop webhook fires:

### 1. Set flag + user data
```javascript
localStorage.setItem('aurea_just_purchased', 'true');
localStorage.setItem('aurea_user_id', 'test-user-123');
```

### 2. Refresh homepage
```javascript
location.reload();
```

### 3. Should auto-redirect to thank-you

---

## Production vs Development

| Feature | Development | Production |
|---------|-------------|------------|
| Whop redirect | ❌ Not configured | ✅ Set in Whop dashboard |
| Webhook tracking | ✅ Works | ✅ Works |
| Auto-redirect | ✅ Via SDK | ✅ Via SDK + Whop |
| Email link | ✅ Manual | ✅ Automated |
| Test method | Console flags | Real purchases |

---

## Next Steps

Once you've verified the flow works in dev:

1. ✅ Test complete purchase flow
2. ✅ Verify tracking in Aurea CRM
3. ✅ Check analytics show proper Landing → Exit
4. ⚙️ Configure Whop success URL in production
5. 🚀 Deploy to production

---

## Quick Commands Reference

```javascript
// Set purchase flag
localStorage.setItem('aurea_just_purchased', 'true');

// Check flag
localStorage.getItem('aurea_just_purchased');

// Clear flag
localStorage.removeItem('aurea_just_purchased');

// Clear all
localStorage.clear();

// Reload page
location.reload();

// Check SDK
window.aurea;

// Check anonymous ID
localStorage.getItem('aurea_anonymous_id');

// Check session ID
sessionStorage.getItem('aurea_session_id');
```

