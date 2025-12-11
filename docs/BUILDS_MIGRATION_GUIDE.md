# Builds Feature Migration Guide

This guide helps existing Container Manager users adopt the new Builds feature.

## What's New

The Builds feature adds the ability to:
- Connect GitHub and GitLab repositories
- Build Docker images directly from source code
- Automatically deploy containers from built images
- Track build history and view logs

## Before You Start

### Prerequisites

1. **OAuth Applications**: You'll need to create OAuth applications on GitHub and/or GitLab
2. **Environment Variables**: New environment variables need to be added
3. **Docker Access**: Ensure Docker has sufficient resources for building images

### Compatibility

- ✅ Works with existing containers and images
- ✅ No changes to existing features
- ✅ Optional feature - can be ignored if not needed
- ✅ No database migrations required

## Migration Steps

### Step 1: Update Environment Variables

Add these new variables to your `.env` file:

```bash
# GitHub OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# GitLab OAuth (optional)
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
```

**Note**: If you don't plan to use the Builds feature, you can leave these empty.

### Step 2: Create OAuth Applications (Optional)

Only if you want to use the Builds feature:

#### GitHub
1. Go to https://github.com/settings/developers
2. Create new OAuth App
3. Set callback URL: `{YOUR_URL}/api/builds/auth/github/callback`
4. Copy credentials to `.env`

#### GitLab
1. Go to https://gitlab.com/-/profile/applications
2. Create new application
3. Set redirect URI: `{YOUR_URL}/api/builds/auth/gitlab/callback`
4. Select scopes: `api`, `read_repository`
5. Copy credentials to `.env`

### Step 3: Restart Application

```bash
npm run dev
```

### Step 4: Verify Installation

1. Navigate to the new "Builds" page in the sidebar
2. If OAuth is configured, you should see the "Connect Repository" button
3. If OAuth is not configured, the page will still load but authentication will fail

## Feature Comparison

### Before (Manual Process)

1. Clone repository locally
2. Build Docker image: `docker build -t my-app .`
3. Push to registry (if needed)
4. Pull image in Container Manager
5. Create container manually

### After (Automated Process)

1. Connect repository once
2. Click "Build" button
3. Select branch/tag
4. Image builds automatically
5. Container deploys automatically (optional)

## Common Migration Scenarios

### Scenario 1: Existing Manual Workflow

**Before**: You manually build and push images, then pull them in Container Manager.

**After**: 
1. Connect your repository
2. Build directly from source
3. Skip the manual build/push steps

**Benefits**: Faster deployment, no need for registry, automatic tagging

### Scenario 2: CI/CD Pipeline

**Before**: CI/CD builds and pushes to registry, Container Manager pulls from registry.

**After**: 
- Keep your CI/CD pipeline for production
- Use Builds feature for development/testing
- Or replace CI/CD with Builds feature for simpler projects

**Benefits**: Simplified workflow for smaller projects, faster iteration

### Scenario 3: Multiple Environments

**Before**: Separate images for dev/staging/prod, manual management.

**After**:
- Build from different branches (dev, staging, main)
- Automatic tagging with commit hash
- Easy rollback to previous commits

**Benefits**: Better version control, easier environment management

## Rollback Plan

If you encounter issues with the Builds feature:

1. **Feature is Optional**: Simply don't use the Builds page
2. **No Data Loss**: Existing containers and images are unaffected
3. **Remove OAuth**: Delete OAuth credentials from `.env` if desired
4. **Continue Manual Workflow**: All existing features work as before

## Troubleshooting

### "Builds page is empty"

**Cause**: OAuth not configured or not authenticated

**Solution**: 
- Configure OAuth credentials in `.env`
- Or continue using manual image management

### "Build fails immediately"

**Cause**: Docker resource constraints or configuration issues

**Solution**:
- Check Docker has sufficient memory/CPU
- Verify Docker socket path in `.env`
- Check build logs for specific errors

### "OAuth authentication fails"

**Cause**: Incorrect OAuth configuration

**Solution**:
- Verify callback URLs match exactly
- Check `NEXTAUTH_URL` is correct
- Ensure OAuth app is active

## Best Practices

### For Development

- Use Builds feature for rapid iteration
- Enable auto-deploy for instant testing
- Build from feature branches

### For Production

- Consider keeping existing CI/CD pipeline
- Use Builds feature for emergency hotfixes
- Build from tagged releases

### For Teams

- Share OAuth credentials securely
- Document which repositories are connected
- Use consistent naming conventions for images

## Performance Considerations

### Build Times

- First build: Slower (full clone + build)
- Subsequent builds: Same as manual builds
- Shallow clones used to minimize clone time

### Resource Usage

- Builds consume Docker resources
- Temporary disk space needed for clones
- Automatic cleanup after build

### Recommendations

- Ensure adequate disk space (5-10GB free)
- Monitor Docker resource usage
- Clean up old images regularly

## Security Considerations

### OAuth Tokens

- Stored in memory only (not persisted)
- Re-authentication required after restart
- Tokens have same permissions as your account

### Repository Access

- Only repositories you have access to
- Private repositories supported
- OAuth scopes limited to repository read

### Best Practices

- Use separate OAuth apps for dev/prod
- Rotate OAuth secrets regularly
- Review connected applications periodically
- Don't share OAuth credentials

## Support and Feedback

### Getting Help

1. Check the documentation:
   - `BUILDS_FEATURE.md` - Feature overview
   - `BUILDS_SETUP_GUIDE.md` - Setup instructions
   - `BUILDS_API_REFERENCE.md` - API documentation

2. Review build logs for errors

3. Check Docker logs: `docker logs <container-name>`

### Reporting Issues

When reporting issues, include:
- Build logs (available in Build History)
- Docker version: `docker --version`
- Node version: `node --version`
- Error messages from browser console

## Next Steps

1. ✅ Complete migration steps above
2. ✅ Connect your first repository
3. ✅ Build your first image
4. ✅ Explore auto-deploy feature
5. ✅ Review build history
6. ✅ Integrate into your workflow

## FAQ

**Q: Do I have to use the Builds feature?**
A: No, it's completely optional. All existing features continue to work.

**Q: Can I use both manual and automated builds?**
A: Yes, they work side-by-side. Use whichever is appropriate.

**Q: Will this affect my existing containers?**
A: No, existing containers and images are unaffected.

**Q: Can I build from private repositories?**
A: Yes, OAuth authentication provides access to private repositories.

**Q: How long are OAuth tokens valid?**
A: Tokens are stored in memory and lost on restart. Re-authentication is required.

**Q: Can multiple users share the same OAuth credentials?**
A: Yes, but each user should ideally have their own OAuth app for security.

**Q: What happens if a build fails?**
A: The build status is marked as failed, logs are available, and you can retry.

**Q: Can I cancel a running build?**
A: Not currently, but builds timeout after a reasonable period.

**Q: Are build logs persisted?**
A: Currently stored in memory. Download logs if you need to keep them.

**Q: Can I build from multiple branches?**
A: Yes, select any branch or tag when building.
