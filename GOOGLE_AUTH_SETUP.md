# Google Authentication Setup Guide

This guide will walk you through setting up Google Sign-In for your application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application domain/URL

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Your App Name Auth")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your Google Cloud project, go to the [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Click "Enable APIs and Services"
3. Search for "Google+ API" or "Google Sign-In API"
4. Click on it and then click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose "External" user type (unless you're using Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Your application name
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the Scopes page, click "Save and Continue" (default scopes are sufficient)
7. On the Test users page, add test email addresses if needed
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application" as the application type
4. Enter a name for your OAuth client
5. Add your authorized origins:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
6. Add your authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
7. Click "Create"

## Step 5: Save Your Credentials

After creating the OAuth client, you'll see a dialog with:
- **Client ID**: A long string ending in `.apps.googleusercontent.com`
- **Client Secret**: A shorter string

**Important**: Copy these values immediately as you'll need them for your environment variables.

## Step 6: Configure Environment Variables

1. Create or update your `.env.local` file in your project root
2. Add the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth Configuration (if using NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
```

### Generating NEXTAUTH_SECRET

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use an online generator like [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

## Step 7: Update Your Application Code

If you're using NextAuth.js, your configuration should look like this:

```javascript
// pages/api/auth/[...nextauth].js or app/api/auth/[...nextauth]/route.js
import GoogleProvider from "next-auth/providers/google"

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
})
```

## Step 8: Test Your Setup

1. Start your development server
2. Navigate to your sign-in page
3. Click the "Sign in with Google" button
4. You should be redirected to Google's OAuth consent screen
5. After granting permissions, you should be redirected back to your app

## Troubleshooting

### Common Issues

**Error: "redirect_uri_mismatch"**
- Check that your redirect URI in Google Cloud Console exactly matches your application's callback URL
- Ensure you've added both development and production URLs

**Error: "invalid_client"**
- Verify your Client ID and Client Secret are correct
- Check that there are no extra spaces or characters in your environment variables

**Error: "access_blocked"**
- Your OAuth consent screen might need verification
- For development, add test users to your OAuth consent screen

**Error: "unauthorized_client"**
- Make sure the Google+ API is enabled for your project
- Verify your OAuth client type is set to "Web application"

### Development vs Production

**Development:**
- Use `http://localhost:3000` for authorized origins
- Use `http://localhost:3000/api/auth/callback/google` for redirect URIs

**Production:**
- Use your actual domain with HTTPS
- Update redirect URIs to match your production URLs
- Consider publishing your OAuth consent screen for public use

## Security Best Practices

1. **Never commit credentials to version control**
   - Add `.env.local` to your `.gitignore` file
   - Use environment variables for all sensitive data

2. **Use HTTPS in production**
   - Google requires HTTPS for production OAuth flows
   - Ensure your redirect URIs use HTTPS

3. **Regularly rotate secrets**
   - Periodically generate new client secrets
   - Update your environment variables accordingly

4. **Limit OAuth scopes**
   - Only request the minimum permissions needed
   - Review and audit requested scopes regularly

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider Documentation](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you encounter issues not covered in this guide:
1. Check the Google Cloud Console for any error messages
2. Review your application logs for detailed error information
3. Consult the official documentation for your authentication library