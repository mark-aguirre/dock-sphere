# User Registration & Access Control Setup

This guide will help you set up the user registration and access control system for Container Hub Plus.

## 1. Database Setup

### Create the Users Table

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `sql/create_users_table.sql`

This will create:
- `users` table with proper structure
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp updates

### Verify Table Creation

```sql
-- Check if table was created successfully
SELECT * FROM users LIMIT 5;
```

## 2. Configure Admin Users

### Method 1: Environment Variable (Recommended for Development)

Edit your `.env` file and add admin emails:

```bash
# Add this to your .env file
ADMIN_EMAILS=admin@yourdomain.com,another-admin@yourdomain.com
```

### Method 2: Database Insert (Recommended for Production)

```sql
-- Insert admin users directly into the database
INSERT INTO users (id, email, name, is_active) 
VALUES 
  ('admin_001', 'your-email@domain.com', 'Your Name', true),
  ('admin_002', 'another-admin@domain.com', 'Admin Name', true)
ON CONFLICT (email) DO NOTHING;
```

## 3. Update Admin Configuration

Edit `app/api/admin/users/route.ts` and update the `ADMIN_EMAILS` array:

```typescript
// Replace with your actual admin emails
const ADMIN_EMAILS = [
  'your-email@domain.com',
  'another-admin@domain.com',
];
```

## 4. Test the Setup

### 4.1 Test Database Connection

```bash
npm run dev
```

Visit `http://localhost:3000/api/health` to ensure the app starts correctly.

### 4.2 Test Authentication Flow

1. Try to access the app without signing in
2. You should be redirected to the sign-in page
3. Sign in with Google
4. If you're not registered, you should see the "Access Denied" page

### 4.3 Register Your First User

1. Sign in as an admin user (one you added to the database)
2. Go to `/admin/users`
3. Click "Add User" and register yourself or other users
4. Test signing in with the newly registered user

## 5. Security Features

### What's Protected

✅ **All routes** except auth pages are protected  
✅ **Database verification** - users must exist in the database  
✅ **Active status check** - deactivated users cannot access  
✅ **Admin-only user management** - only admins can add/remove users  
✅ **Automatic session validation** - sessions are checked against database  

### Access Control Flow

1. **Middleware Check**: Every request is intercepted
2. **Token Validation**: NextAuth token is verified
3. **Database Lookup**: User existence and active status checked
4. **Route Protection**: Unauthorized users redirected appropriately

## 6. User Management

### Admin Interface

Access the admin panel at `/admin/users` to:
- View all registered users
- Add new users
- Deactivate existing users
- Monitor user activity

### API Endpoints

- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users` - Register or deactivate users (admin only)

## 7. Troubleshooting

### Common Issues

**"Access Denied" for admin users:**
- Verify the admin email is in the `ADMIN_EMAILS` array
- Check if the admin user exists in the database
- Ensure the user's `is_active` status is `true`

**Database connection errors:**
- Verify Supabase credentials in `.env`
- Check if the `users` table exists
- Ensure RLS policies are properly configured

**Middleware not working:**
- Check if `middleware.ts` is in the root directory
- Verify the matcher configuration
- Check server logs for errors

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=DEBUG
```

This will show detailed authentication flow logs.

## 8. Production Deployment

### Environment Variables

Ensure these are set in production:

```bash
NEXTAUTH_SECRET=your-production-secret
DATABASE_URL=your-production-database-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=admin1@domain.com,admin2@domain.com
```

### Security Checklist

- [ ] Change default admin emails
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS in production
- [ ] Review RLS policies
- [ ] Monitor user access logs
- [ ] Set up database backups

## 9. Next Steps

1. **Customize the UI**: Modify auth pages to match your branding
2. **Add Role-Based Access**: Extend the system with user roles
3. **Email Notifications**: Send welcome emails to new users
4. **Audit Logging**: Track user actions for compliance
5. **SSO Integration**: Add SAML or other enterprise auth providers

## Support

If you encounter issues:
1. Check the server logs (`LOG_LEVEL=DEBUG`)
2. Verify database connectivity
3. Test with a fresh browser session
4. Review the Supabase dashboard for errors

The system is now configured to ensure only registered users in your database can access Container Hub Plus!