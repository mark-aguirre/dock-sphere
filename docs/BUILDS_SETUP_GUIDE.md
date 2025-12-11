# Builds Feature Setup Guide

This guide will help you set up the Git repository integration feature to build Docker images from your GitHub or GitLab repositories.

## Prerequisites

- Docker installed and running
- GitHub or GitLab account
- Container Manager application running

## Quick Start

### Step 1: Configure OAuth Application

#### For GitHub:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Container Manager (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (or your deployment URL)
   - **Authorization callback URL**: `http://localhost:3000/api/builds/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

#### For GitLab:

1. Go to [GitLab Applications](https://gitlab.com/-/profile/applications)
2. Fill in the details:
   - **Name**: Container Manager (or your preferred name)
   - **Redirect URI**: `http://localhost:3000/api/builds/auth/gitlab/callback`
   - **Scopes**: Select `api` and `read_repository`
3. Click "Save application"
4. Copy the **Application ID** and **Secret**

### Step 2: Update Environment Variables

1. Open your `.env` file in the project root
2. Add your OAuth credentials:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# GitLab OAuth (optional)
GITLAB_CLIENT_ID=your_gitlab_application_id_here
GITLAB_CLIENT_SECRET=your_gitlab_secret_here

# Make sure NEXTAUTH_URL is set correctly
NEXTAUTH_URL=http://localhost:3000
```

3. Save the file

### Step 3: Restart the Application

```bash
npm run dev
```

### Step 4: Connect Your First Repository

1. Navigate to the **Builds** page in the sidebar
2. Click **"Connect Repository"**
3. Select your provider (GitHub or GitLab)
4. Click **"Authenticate with [Provider]"**
5. Authorize the application in the OAuth flow
6. You'll be redirected back to the application
7. Select a repository from the dropdown
8. Specify the Dockerfile path (default is "Dockerfile")
9. Click **"Connect Repository"**

### Step 5: Build Your First Image

1. Find your connected repository in the list
2. Click the **"Build"** button
3. Configure the build:
   - Select a branch or tag
   - Choose a Dockerfile (if multiple exist)
   - Enter an image name (e.g., "my-app")
   - Enter an image tag (e.g., "latest")
   - Optionally enable "Auto-deploy on successful build"
4. Click **"Start Build"**
5. Monitor the build progress in real-time

## Troubleshooting

### "Not authenticated" error

**Solution**: Make sure you've completed the OAuth flow and your tokens are valid. Try disconnecting and reconnecting the repository.

### "Repository not found" error

**Solution**: Ensure the repository exists and you have access to it. For private repositories, make sure the OAuth scopes include repository access.

### Build fails with "Dockerfile not found"

**Solution**: 
- Verify the Dockerfile path is correct (case-sensitive)
- Ensure the Dockerfile exists in the repository
- Try using a different branch if the Dockerfile is not in the default branch

### OAuth callback fails

**Solution**:
- Verify the callback URL in your OAuth app settings matches exactly: `http://localhost:3000/api/builds/auth/[provider]/callback`
- Check that `NEXTAUTH_URL` in `.env` is set correctly
- Ensure the application is running on the correct port

### Build succeeds but image not found

**Solution**: 
- Check Docker images list: `docker images`
- Verify the image name and tag used during build
- Check build logs for any warnings or errors

## Advanced Configuration

### Using Custom Docker Registry

To push built images to a custom registry, you can modify the image name to include the registry URL:

```
registry.example.com/my-app:latest
```

### Multiple Dockerfiles

If your repository contains multiple Dockerfiles (e.g., `Dockerfile.dev`, `Dockerfile.prod`), you can:

1. Specify the path during repository connection
2. Or select the Dockerfile during build configuration

### Auto-Deploy Configuration

When enabling auto-deploy:
- The container will be created with default settings
- You can customize the container after deployment
- The container name will be `[image-name]-[timestamp]`

## Security Best Practices

1. **Never commit OAuth secrets**: Keep your `.env` file out of version control
2. **Use environment-specific credentials**: Different credentials for dev/staging/prod
3. **Rotate secrets regularly**: Update OAuth secrets periodically
4. **Limit OAuth scopes**: Only grant necessary permissions
5. **Review connected apps**: Periodically review authorized applications in GitHub/GitLab

## Production Deployment

For production deployments:

1. Use HTTPS for all URLs
2. Update OAuth callback URLs to use your production domain
3. Store secrets securely (e.g., environment variables, secret management service)
4. Consider implementing persistent token storage with encryption
5. Set up monitoring and logging for build processes

## Support

If you encounter issues:

1. Check the application logs
2. Review build output in the Build History tab
3. Verify Docker is running: `docker ps`
4. Check OAuth app configuration
5. Ensure environment variables are set correctly

## Next Steps

- Explore the Build History tab to view past builds
- Set up automatic deployments for your applications
- Configure multiple repositories for different projects
- Integrate with your CI/CD pipeline
