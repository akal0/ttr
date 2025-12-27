# Email Subscription Management System

## Overview

This system tracks email subscription statuses in the database to enable proper email list management and analytics. Users are **never deleted** from the database - instead, their subscription status is tracked.

## Email Statuses

### 1. **Active** (Default)
- User is subscribed and receiving emails
- Can receive all email types (transactional + marketing)
- Set automatically when user first completes payment

### 2. **Unsubscribed**
- User clicked unsubscribe link
- Should NOT receive marketing emails
- Can still receive critical transactional emails (receipts, account notifications)
- Timestamp tracked in `unsubscribedAt` field

### 3. **Bounced**
- Email address bounced (hard bounce or repeated soft bounces)
- Should NOT receive ANY emails
- Typically set via Resend webhook when bounce is detected
- Helps maintain sender reputation

## Database Schema

```typescript
{
  whopUserId: string (primary key)
  email: string
  username: string
  name: string
  emailStatus: 'active' | 'unsubscribed' | 'bounced'
  createdAt: timestamp
  updatedAt: timestamp
  unsubscribedAt: timestamp | null
}
```

## Unsubscribe Flow

### 1. User Clicks Unsubscribe in Email

Resend automatically includes `{{{RESEND_UNSUBSCRIBE_URL}}}` in your templates which points to:

**Development:**
```
http://localhost:3001/api/unsubscribe?email=user@example.com
```

**Production:**
```
https://yourdomain.com/api/unsubscribe?email=user@example.com
```

### 2. Unsubscribe Page

The API endpoint at `/api/unsubscribe` handles the request:

1. Validates email parameter exists
2. Looks up user in database by email
3. Checks current subscription status
4. Updates status to "unsubscribed"
5. Sets `unsubscribedAt` timestamp
6. Shows confirmation page

### 3. User Experience

**Success Page:**
- Confirms unsubscription
- Shows unsubscribed email and date
- Offers link to rejoin community

**Already Unsubscribed:**
- Informs user they're already unsubscribed
- Shows rejoin link

**Error Handling:**
- Invalid email: Shows error message
- User not found: Shows not found message
- Database error: Shows generic error with support contact

## API Functions

### User Lookup

```typescript
// Get user by Whop user ID (for webhooks)
getUserFromDatabase(whopUserId: string): Promise<User | null>

// Get user by email (for unsubscribe)
getUserByEmail(email: string): Promise<User | null>
```

### Status Management

```typescript
// Update to any status
updateEmailStatus(email: string, status: EmailStatus): Promise<boolean>

// Convenience functions
unsubscribeUser(email: string): Promise<boolean>
markUserBounced(email: string): Promise<boolean>
resubscribeUser(email: string): Promise<boolean>
```

## Resend Template Setup

### Configure Unsubscribe URL in Template

In your Resend template HTML, add the unsubscribe link using the custom `UNSUBSCRIBE_URL` variable:

```html
<p style="font-size: 12px; color: #666; text-align: center;">
  Don't want these emails?
  <a href="{{{UNSUBSCRIBE_URL}}}">Unsubscribe</a>
</p>
```

**Important:** The `UNSUBSCRIBE_URL` variable is passed from the backend code with the user's email pre-encoded. Do NOT use Resend's reserved `RESEND_UNSUBSCRIBE_URL` variable.

## Email Sending Best Practices

### Check Status Before Sending

```typescript
const user = await getUserByEmail(email);

if (user.emailStatus === 'unsubscribed') {
  // Only send critical transactional emails
  if (emailType === 'receipt' || emailType === 'account_notification') {
    await sendEmail(email, template);
  } else {
    console.log(`Skipping marketing email for unsubscribed user: ${email}`);
  }
}

if (user.emailStatus === 'bounced') {
  // Don't send ANY emails
  console.log(`Skipping email to bounced address: ${email}`);
  return;
}
```

### Email Types

**Transactional (Always Send):**
- Payment receipts
- Refund confirmations
- Account security alerts
- Password resets
- Purchase confirmations

**Marketing (Respect Unsubscribe):**
- Welcome emails
- Cancellation win-back emails
- Newsletter
- Promotional offers
- Re-engagement campaigns

## Future: Resend Bounce Webhooks

When you're ready to handle bounces automatically, create a webhook handler:

```typescript
// /api/webhooks/resend/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (data.type === 'email.bounced') {
    await markUserBounced(data.email);
  }

  return new Response('OK');
}
```

Register this webhook in Resend Dashboard:
- Settings → Webhooks
- URL: `https://yourdomain.com/api/webhooks/resend`
- Events: `email.bounced`, `email.complained`

## Analytics Queries (Future Dashboard)

### Total Subscribers by Status

```sql
SELECT
  email_status,
  COUNT(*) as count
FROM users
GROUP BY email_status;
```

### Unsubscribe Rate

```sql
SELECT
  COUNT(CASE WHEN email_status = 'unsubscribed' THEN 1 END) * 100.0 / COUNT(*) as unsubscribe_rate
FROM users;
```

### Recent Unsubscribes

```sql
SELECT
  email,
  name,
  unsubscribed_at
FROM users
WHERE email_status = 'unsubscribed'
ORDER BY unsubscribed_at DESC
LIMIT 10;
```

### Active Subscribers

```sql
SELECT
  email,
  name,
  created_at
FROM users
WHERE email_status = 'active'
ORDER BY created_at DESC;
```

## Testing

### Test Unsubscribe Flow

1. Make a test purchase
2. Check your email for the cancellation email (or any email with unsubscribe link)
3. Click unsubscribe link
4. Verify you see the success page
5. Check database: `emailStatus` should be "unsubscribed"
6. Try unsubscribing again - should see "already unsubscribed" message

### Test in Development

Visit: `http://localhost:3001/api/unsubscribe?email=test@example.com`

### Check Database Status

```bash
bun run db:studio
```

Then navigate to the `users` table and check the `email_status` column.

## Production Checklist

- [ ] Update DATABASE_URL to production Supabase
- [ ] Run `bun run db:push` to create tables in production
- [ ] Deploy to Vercel/production
- [ ] Update Resend default unsubscribe URL to production domain
- [ ] Test unsubscribe flow in production
- [ ] Set up Resend bounce webhooks
- [ ] Monitor unsubscribe rates
- [ ] Build analytics dashboard (future)

## Support

If users want to resubscribe, they can:
1. Contact support (reply to any email)
2. Manually set `emailStatus` back to "active" in database
3. Make a new purchase (automatically resubscribes)
