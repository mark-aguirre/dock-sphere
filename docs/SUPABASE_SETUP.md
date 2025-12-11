# Supabase Setup Guide

## Quick Setup

Your Supabase project is already configured in `.env`. Follow these steps to complete the setup:

### 1. Run SQL Schema

1. Go to your Supabase SQL Editor:
   **https://YOUR_PROJECT.supabase.co/project/YOUR_PROJECT/sql**

2. Click **"New Query"**

3. Copy the entire contents of `prisma/supabase-setup.sql`

4. Paste into the SQL Editor

5. Click **"Run"** or press `Ctrl+Enter`

6. You should see: "Setup complete! Tables created: 7"

### 2. Verify Tables

In the Supabase Dashboard, go to **Table Editor** and verify these tables exist:
- ✅ User
- ✅ Account
- ✅ Session
- ✅ VerificationToken
- ✅ OAuthProvider
- ✅ Repository
- ✅ Build

### 3. Configure OAuth Providers

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to **Settings** in the app

3. Scroll to **Git OAuth Integration**

4. Configure GitHub and/or GitLab:
   - Enter Client ID
   - Enter Client Secret
   - Toggle to enable
   - Click **Save OAuth Settings**

## Connection Details

Your `.env` file is already configured with:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres?schema=public
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Row Level Security (RLS)

The setup script enables RLS on all tables with these policies:

- **User/Account/Session**: Users can only view their own data
- **OAuthProvider**: Authenticated users can read, service role can manage
- **Repository/Build**: Authenticated users have full access

### Disable RLS (Optional - for development only)

If you encounter permission issues during development, you can temporarily disable RLS:

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OAuthProvider" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Repository" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Build" DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: Only disable RLS in development. Always keep it enabled in production!

## Testing the Connection

Create a test file to verify the connection:

```typescript
// test-db.ts
import { prisma } from './lib/prisma';

async function testConnection() {
  try {
    const providers = await prisma.oAuthProvider.findMany();
    console.log('✅ Database connected!');
    console.log('OAuth Providers:', providers);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run it:
```bash
npx tsx test-db.ts
```

## Supabase Dashboard Links

- **SQL Editor**: https://YOUR_PROJECT.supabase.co/project/YOUR_PROJECT/sql
- **Table Editor**: https://YOUR_PROJECT.supabase.co/project/YOUR_PROJECT/editor
- **Database Settings**: https://YOUR_PROJECT.supabase.co/project/YOUR_PROJECT/settings/database
- **API Settings**: https://YOUR_PROJECT.supabase.co/project/YOUR_PROJECT/settings/api

## Useful SQL Queries

### View OAuth Configuration
```sql
SELECT provider, "clientId", enabled, "updatedAt" 
FROM "OAuthProvider";
```

### View All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Row Counts
```sql
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'OAuthProvider', COUNT(*) FROM "OAuthProvider"
UNION ALL
SELECT 'Repository', COUNT(*) FROM "Repository"
UNION ALL
SELECT 'Build', COUNT(*) FROM "Build";
```

### View Recent Builds
```sql
SELECT 
    b.id,
    r."fullName" as repository,
    b.branch,
    b.status,
    b."createdAt"
FROM "Build" b
JOIN "Repository" r ON b."repositoryId" = r.id
ORDER BY b."createdAt" DESC
LIMIT 10;
```

## Troubleshooting

### "relation does not exist" Error

Run the setup SQL script again in the Supabase SQL Editor.

### Permission Denied Errors

1. Check if RLS is causing issues
2. Verify your API key is correct in `.env`
3. Try disabling RLS for development (see above)

### Connection Timeout

1. Check your internet connection
2. Verify the DATABASE_URL in `.env` is correct
3. Check Supabase project status in dashboard

### Password Special Characters

The password contains special characters (`$X2FX*YHP?!Uq9M`). If you have connection issues, try URL encoding:
```
$X2FX*YHP?!Uq9M → %24X2FX%2AYHP%3F%21Uq9M
```

Update DATABASE_URL:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres?schema=public
```

## Backup and Restore

### Backup
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or download from dashboard
# Settings → Database → Database Backups
```

### Restore
```bash
# Using Supabase CLI
supabase db reset
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres -f backup.sql
```

## Next Steps

1. ✅ Run the SQL setup script
2. ✅ Verify tables in Table Editor
3. ✅ Test database connection
4. ✅ Configure OAuth providers in Settings UI
5. ✅ Start building!

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Dashboard: https://YOUR_PROJECT.supabase.co
