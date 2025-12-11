@echo off
REM Database Setup Script for Container Hub Plus (Windows)
REM This script sets up Supabase for the application

echo 🚀 Setting up Supabase for Container Hub Plus...
echo.

REM Install Supabase client
echo 📦 Installing Supabase client...
call npm install @supabase/supabase-js

echo.
echo ✅ Supabase client installed!
echo.
echo 📋 Next steps:
echo 1. Go to Supabase SQL Editor: https://YOUR_PROJECT.supabase.co/project/YOUR_PROJECT/sql
echo 2. Click 'New Query'
echo 3. Copy and paste the SQL from: prisma/supabase-setup.sql
echo 4. Click 'Run' to create tables
echo 5. Test connection: node test-supabase.js
echo 6. Start your app: npm run dev
echo.
echo 📖 For detailed instructions, see: docs/SUPABASE_SETUP.md
pause
