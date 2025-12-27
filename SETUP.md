# Tom's Trading Room - Setup Guide

Complete setup guide for your Whop + Discord + Resend funnel integration.

## What's Built

### 1. Funnel Page
- Modern landing page with hero, features, social proof
- Animated CTA button with Framer Motion
- Redirects to Whop checkout

### 2. Discord Webhooks
Rich embeds sent to Discord for all events:
- Checkout initiated
- Payment events (succeeded, failed, pending, refunded, account on hold)
- Membership events (activated, deactivated, went valid, went invalid, cancelled)

### 3. Email Automation (Resend)
Automated emails sent at key moments:
- ✅ **Welcome email** → `membership.activated`
- 🚫 **Cancellation email** → `membership.cancelled`
- 💸 **Refund confirmation** → `payment.refunded`
- ⏰ **Membership expired** → `membership.went_invalid`
- 🛒 **Checkout abandoned** → Via cron job (30 min delay)

### 4. Email List Building
Every user email captured automatically from Whop webhooks and added to Resend audience with source tracking.

---

## Setup Instructions

### 1. Install Dependencies

Already done! You have:
- `@whop/sdk` - Whop API & webhook verification
- `resend` - Email service
- `framer-motion` - Animations

### 2. Discord Webhooks

Create 3 Discord channels and get webhook URLs:

**Channel: #checkout-initiate**
1. Channel Settings → Integrations → Webhooks
2. New Webhook → Copy URL
3. Add to `.env`: `DISCORD_INITIATE_WEBHOOK_URL`

**Channel: #payments**
1. Same process
2. Add to `.env`: `DISCORD_PAYMENTS_WEBHOOK_URL`

**Channel: #memberships**
1. Same process
2. Add to `.env`: `DISCORD_MEMBERSHIPS_WEBHOOK_URL`

### 3. Whop Configuration

**Get API Key:**
1. Whop Dashboard → Developer Settings
2. Create API key
3. Add to `.env`: `WHOP_API_KEY`

**Create Webhook:**
1. Whop Dashboard → Webhooks → New Company Webhook
2. **URL**: For local testing, use ngrok:
   ```bash
   ngrok http 3000
   # Use: https://your-ngrok.ngrok.io/api/webhooks/whop
   ```
3. **Events to enable:**
   - `payment.succeeded`
   - `payment.failed`
   - `payment.pending`
   - `payment.refunded`
   - `payment.account_on_hold`
   - `membership.activated`
   - `membership.deactivated`
   - `membership.went_valid`
   - `membership.went_invalid`
   - `membership.cancelled`

4. Copy **Webhook Secret**
5. Add to `.env`: `WHOP_WEBHOOK_SECRET`

**App ID:**
- Already in your `.env`: `NEXT_PUBLIC_WHOP_APP_ID=app_WRaUj15O8I8nL2`

**Checkout URL:**
- Already in your `.env`: Product URL

### 4. Resend Configuration

**Sign up & Get API Key:**
1. Go to [resend.com](https://resend.com)
2. Sign up (1,000 contacts free)
3. Dashboard → API Keys → Create
4. Add to `.env`: `RESEND_API_KEY`

**Create Audience:**
1. Dashboard → Audiences → Create New
2. Name it "Tom's Trading Room Mailing List"
3. Copy the **Audience ID**
4. Add to `.env`: `RESEND_AUDIENCE_ID`

**Add Domain (for production):**
1. Dashboard → Domains → Add Domain
2. Follow DNS setup instructions
3. Update `FROM_EMAIL` in `src/lib/emails.ts`
4. Change from `[email protected]` to `[email protected]`

### 5. Cron Job for Abandoned Checkouts

**Option A: Vercel Cron (Recommended)**
1. Deploy to Vercel
2. Add `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-abandoned",
    "schedule": "*/30 * * * *"
  }]
}
```

**Option B: External Cron Service**
1. Use [cron-job.org](https://cron-job.org) or similar
2. Create job hitting: `https://your-domain.com/api/cron/check-abandoned`
3. Schedule: Every 30 minutes
4. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

**Set CRON_SECRET:**
```bash
# Generate random secret
openssl rand -base64 32

# Add to .env
CRON_SECRET="your-generated-secret"
```

---

## Environment Variables Summary

Update your `.env` file with all these values:

```env
# Discord Webhook URLs (already set)
DISCORD_INITIATE_WEBHOOK_URL="https://discord.com/api/webhooks/..."
DISCORD_PAYMENTS_WEBHOOK_URL="https://discord.com/api/webhooks/..."
DISCORD_MEMBERSHIPS_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Whop Configuration (already set)
WHOP_API_KEY="apik_..."
WHOP_WEBHOOK_SECRET="ws_..."
NEXT_PUBLIC_WHOP_APP_ID="app_..."
NEXT_PUBLIC_WHOP_CHECKOUT_URL="https://whop.com/..."

# Resend Configuration (UPDATE THESE)
RESEND_API_KEY="re_..."
RESEND_AUDIENCE_ID="..."

# Cron Job Authentication (UPDATE THIS)
CRON_SECRET="your-random-secret-here"
```

---

## Testing

### Local Development
```bash
# Start dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Update Whop webhook URL to ngrok URL
```

### Test Checkout Flow
1. Click "Start Mentorship" button
2. Check Discord #checkout-initiate for notification
3. Complete checkout on Whop
4. Watch Discord for payment + membership events
5. Check email for welcome message
6. Verify contact added to Resend audience

### Test Abandoned Checkout
1. Click CTA but don't complete checkout
2. Wait 30+ minutes (or manually trigger cron)
3. Check Discord for abandoned checkout alert

---

## Email Customization

All email templates are in: `src/lib/emails.ts`

To customize:
1. Edit HTML templates in each function
2. Update colors, copy, CTAs
3. Add your branding/logo
4. Change Discord link to your actual server

---

## Production Checklist

- [ ] Update Resend domain from `[email protected]` to your domain
- [ ] Set up Vercel cron or external cron service
- [ ] Update Whop webhook URL to production domain
- [ ] Add real Discord server invite link in welcome email
- [ ] Test all webhook events in production
- [ ] Monitor Discord + email deliverability
- [ ] Set up Resend domain authentication for better deliverability

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   └── initiate-checkout/route.ts  # CTA click tracking
│   │   ├── webhooks/
│   │   │   └── whop/route.ts               # Main webhook handler
│   │   └── cron/
│   │       └── check-abandoned/route.ts    # Abandoned checkout checker
│   ├── page.tsx                             # Funnel landing page
│   └── layout.tsx
├── components/
│   └── buy-button.tsx                       # CTA button component
└── lib/
    ├── discord.ts                            # Discord webhook utility
    ├── resend-client.ts                      # Resend audience management
    ├── emails.ts                             # Email templates
    ├── whop-sdk.ts                           # Whop SDK config
    └── checkout-tracker.ts                   # Abandoned checkout tracking
```

---

## Support

If you run into issues:
1. Check Whop webhook logs in dashboard
2. Check Next.js console for errors
3. Verify all env variables are set
4. Test webhook signature verification
5. Check Resend dashboard for email delivery status

---

## Next Steps

Want to add more features?
- Analytics dashboard
- Database storage (Postgres/MongoDB)
- Email sequences (drip campaigns)
- Stripe integration as backup
- Admin panel for viewing members
- Revenue charts
- Customer lookup

Let me know what you'd like to build next!
