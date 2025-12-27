# Database Setup Guide (Supabase + Drizzle ORM)

## 1. Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com/)
2. Click "New Project"
3. Choose an organization or create one
4. Fill in project details:
   - Name: `ttr` (or whatever you prefer)
   - Database Password: **Save this securely!**
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Database Connection String

1. Once your project is ready, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with the database password you created

## 3. Update Your .env File

Add the connection string to your `.env` file:

```bash
DATABASE_URL="postgresql://postgres:your-actual-password@db.xxxx.supabase.co:5432/postgres"
```

**IMPORTANT:** Replace `your-actual-password` and `xxxx` with your actual credentials!

## 4. Push the Database Schema to Supabase

Run this command to create the `users` table in your Supabase database:

```bash
bun run db:push
```

This will:
- Connect to your Supabase database
- Create the `users` table with the schema defined in `src/lib/db/schema.ts`
- Set up all columns, indexes, and constraints

## 5. Verify the Setup

You can verify the table was created in Supabase:

1. Go to your Supabase project dashboard
2. Click **Table Editor** in the sidebar
3. You should see a `users` table with these columns:
   - `whop_user_id` (primary key)
   - `email`
   - `username`
   - `name`
   - `created_at`
   - `updated_at`

## 6. Optional: Use Drizzle Studio

To visually browse and edit your database data:

```bash
bun run db:studio
```

This opens a local web interface where you can:
- View all tables and data
- Run queries
- Edit records
- See relationships

## Database Schema

The `users` table stores user information from Whop webhooks:

```typescript
{
  whopUserId: string (primary key)  // Whop's user ID
  email: string (required)           // User's email address
  username: string (nullable)        // Whop username
  name: string (nullable)            // User's full name
  createdAt: timestamp              // When record was created
  updatedAt: timestamp              // When record was last updated
}
```

## How It Works

1. **Payment events** (`payment.succeeded`, `payment.failed`, etc.) include user email
2. These are automatically stored in the database via `storeUserEmail()`
3. **Membership events** (`membership.cancelled`, etc.) don't include email
4. We fetch the email from the database using `getUserFromDatabase()`
5. This allows us to send cancellation/expired emails even though membership webhooks don't include email

## Troubleshooting

### "connection refused" error
- Check your DATABASE_URL is correct
- Verify your Supabase project is running (not paused)
- Check your IP is allowed (Supabase allows all by default)

### "relation does not exist" error
- You need to run `bun run db:push` to create the tables

### Database connection pool errors
- Supabase free tier has connection limits
- The code uses `prepare: false` to work with edge runtimes

## Security Notes

1. **Never commit `.env` to git** - it contains your database credentials
2. Your `.env` file is already in `.gitignore`
3. Use environment variables in production (Vercel automatically handles this)
4. Rotate your database password periodically from Supabase settings
