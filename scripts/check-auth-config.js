#!/usr/bin/env node

/**
 * Check NextAuth configuration
 * Usage: node scripts/check-auth-config.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 NextAuth Configuration Check\n');
console.log('================================\n');

const nextAuthUrl = process.env.NEXTAUTH_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

console.log('✓ NEXTAUTH_URL:', nextAuthUrl || '❌ NOT SET');
console.log('✓ GOOGLE_CLIENT_ID:', googleClientId ? '✓ Set' : '❌ NOT SET');
console.log('✓ GOOGLE_CLIENT_SECRET:', googleClientSecret ? '✓ Set' : '❌ NOT SET');
console.log('✓ NEXTAUTH_SECRET:', nextAuthSecret ? '✓ Set' : '❌ NOT SET');

console.log('\n📋 Required Google Console Settings:\n');
console.log('Authorized JavaScript origins:');
console.log(`  ${nextAuthUrl || 'http://localhost:3000'}`);
console.log('\nAuthorized redirect URIs:');
console.log(`  ${nextAuthUrl || 'http://localhost:3000'}/api/auth/callback/google`);

console.log('\n⚠️  Important Notes:');
console.log('  - URLs must match EXACTLY (no trailing slashes)');
console.log('  - Use http://localhost:3000 NOT http://127.0.0.1:3000');
console.log('  - Changes in Google Console may take a few seconds to propagate');
console.log('  - Clear browser cookies after making changes\n');

// Check for common issues
const issues = [];

if (!nextAuthUrl) {
  issues.push('NEXTAUTH_URL is not set in .env.local');
}

if (!googleClientId) {
  issues.push('GOOGLE_CLIENT_ID is not set in .env.local');
}

if (!googleClientSecret) {
  issues.push('GOOGLE_CLIENT_SECRET is not set in .env.local');
}

if (!nextAuthSecret) {
  issues.push('NEXTAUTH_SECRET is not set in .env.local');
}

if (nextAuthUrl && nextAuthUrl.endsWith('/')) {
  issues.push('NEXTAUTH_URL should not have a trailing slash');
}

if (nextAuthUrl && nextAuthUrl.includes('127.0.0.1')) {
  issues.push('Use "localhost" instead of "127.0.0.1" in NEXTAUTH_URL');
}

if (issues.length > 0) {
  console.log('❌ Issues Found:\n');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
  console.log('');
} else {
  console.log('✅ Configuration looks good!\n');
}
