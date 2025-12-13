# User Registration & Access Control Setup

This guide will help you set up the user registration and access control system for Container Hub Plus.

## 1. Database Setup

### Create the Users Table

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `sql/docksphere.sql`
database

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
