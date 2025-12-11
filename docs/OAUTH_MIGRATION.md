# OAuth Configuration Migration Guide

## Overview

OAuth credentials for GitHub and GitLab can now be configured through the UI instead of environment variables. This provides better security and easier management.

## Migration Steps

### 1. Access Settings Page

Navigate to **Settings** in the application sidebar.

### 2. Configure OAuth Providers

Scroll to the **Git OAuth Integration** section where you'll find:

- **GitHub OAuth Configuration**
  - Client ID
  - Client Secret
  - Enable/Disable toggle

- **GitLab OAuth Configuration**
  - Application ID
  - Secret
  - Enable/Disable toggle

### 3. Enter Credentials

1. Toggle the provider you want to enable
2. Enter your OAuth Client ID
3. Enter your OAuth Client Secret (use the eye icon to show/hide)
4. Note the callback URL displayed below each secret field
5. Click **Save OAuth Settings**

### 4. Remove from .env (Optional)

Once configured via UI, you can remove these lines from your `.env` file:

```env
# These can be removed after configuring via UI
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
```

## How It Works

### Storage

- Credentials are stored in `data/oauth-config.json`
- Client secrets are encrypted using AES-256-CBC
- The encryption key is derived from `NEXTAUTH_SECRET`

### Backward Compatibility

The system maintains backward compatibility:
1. First checks for UI-configured credentials
2. Falls back to environment variables if not found
3. UI configuration takes precedence over environment variables

### Security Features

- Secrets are encrypted at rest
- Secrets are masked in the UI (shown as `••••••••`)
- Only authenticated users can access/modify OAuth settings
- Requires valid session to save changes

## Setting Up OAuth Apps

### GitHub

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `DockSphere` (or your app name)
   - Homepage URL: `http://localhost:3000` (or your domain)
   - Authorization callback URL: `http://localhost:3000/api/builds/auth/github/callback`
4. Copy the Client ID and generate a Client Secret
5. Enter these in the Settings page

### GitLab

1. Go to GitLab User Settings → Applications
2. Fill in:
   - Name: `DockSphere` (or your app name)
   - Redirect URI: `http://localhost:3000/api/builds/auth/gitlab/callback`
   - Scopes: Select `api`
3. Click "Save application"
4. Copy the Application ID and Secret
5. Enter these in the Settings page

## Troubleshooting

### "OAuth not configured" Error

- Ensure the provider is enabled in Settings
- Verify both Client ID and Secret are entered
- Check that credentials are saved (click Save button)

### Authentication Fails

- Verify callback URLs match exactly in your OAuth app settings
- Check that the provider is enabled
- Ensure credentials are correct (re-enter if needed)

### Cannot Save Settings

- Ensure you're logged in
- Check browser console for errors
- Verify `data/` directory is writable

## API Reference

### GET /api/settings/oauth

Retrieves current OAuth configuration (secrets are masked).

**Response:**
```json
{
  "github": {
    "clientId": "your-client-id",
    "clientSecret": "••••••••",
    "enabled": true
  },
  "gitlab": {
    "clientId": "your-app-id",
    "clientSecret": "••••••••",
    "enabled": false
  }
}
```

### POST /api/settings/oauth

Saves OAuth configuration.

**Request Body:**
```json
{
  "github": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "enabled": true
  },
  "gitlab": {
    "clientId": "your-app-id",
    "clientSecret": "your-secret",
    "enabled": true
  }
}
```

**Response:**
```json
{
  "success": true
}
```
