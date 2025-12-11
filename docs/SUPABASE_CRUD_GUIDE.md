# Supabase CRUD Operations Guide

Complete guide for using the Supabase services in your application.

## Table of Contents

1. [Services Overview](#services-overview)
2. [OAuth Provider Service](#oauth-provider-service)
3. [Repository Service](#repository-service)
4. [Build Service](#build-service)
5. [API Routes](#api-routes)
6. [Usage Examples](#usage-examples)

## Services Overview

We have three main services for database operations:

- **OAuthService** - Manage GitHub/GitLab OAuth credentials
- **RepositoryService** - Manage connected Git repositories
- **BuildService** - Manage Docker image builds

All services use Supabase client and provide full CRUD operations.

## OAuth Provider Service

Located: `lib/services/supabase-oauth-service.ts`

### Methods

#### Create
```typescript
await OAuthService.create({
  provider: 'github',
  clientId: 'your-client-id',
  clientSecret: 'your-secret',
  enabled: true,
  callbackUrl: 'http://localhost:3000/api/auth/callback'
});
```

#### Read
```typescript
// Get all providers
const all = await OAuthService.getAll();

// Get specific provider
const github = await OAuthService.getByProvider('github');

// Get enabled providers only
const enabled = await OAuthService.getEnabled();

// Get masked (for UI display)
const masked = await OAuthService.getAllMasked();
```

#### Update
```typescript
// Update provider
await OAuthService.update('github', {
  clientId: 'new-id',
  enabled: false
});

// Toggle enabled status
await OAuthService.toggleEnabled('github', true);
```

#### Delete
```typescript
await OAuthService.delete('github');
```

#### Upsert
```typescript
// Create if doesn't exist, update if exists
await OAuthService.upsert({
  provider: 'gitlab',
  clientId: 'id',
  clientSecret: 'secret',
  enabled: true
});
```

### Security Features

- Client secrets are **encrypted** using AES-256-CBC
- Secrets are **masked** (••••••••) in UI responses
- Only authenticated users can access

## Repository Service

Located: `lib/services/supabase-repository-service.ts`

### Methods

#### Create
```typescript
await RepositoryService.create({
  provider: 'github',
  name: 'my-app',
  fullName: 'username/my-app',
  defaultBranch: 'main',
  dockerfilePath: 'Dockerfile',
  repositoryUrl: 'https://github.com/username/my-app.git'
});
```

#### Read
```typescript
// Get all repositories
const all = await RepositoryService.getAll();

// Get with build statistics
const withStats = await RepositoryService.getAllWithStats();
// Returns: { ...repo, buildCount, lastBuildStatus, lastBuildDate }

// Get by ID
const repo = await RepositoryService.getById('repo-id');

// Get by provider
const githubRepos = await RepositoryService.getByProvider('github');

// Search repositories
const results = await RepositoryService.search('my-app');
```

#### Update
```typescript
// Update repository
await RepositoryService.update('repo-id', {
  dockerfilePath: 'docker/Dockerfile',
  defaultBranch: 'develop'
});

// Update dockerfile path only
await RepositoryService.updateDockerfilePath('repo-id', 'Dockerfile.prod');
```

#### Delete
```typescript
// Delete single repository
await RepositoryService.delete('repo-id');

// Delete multiple repositories
await RepositoryService.deleteMany(['id1', 'id2', 'id3']);
```

#### Utilities
```typescript
// Check if repository exists
const exists = await RepositoryService.exists('username/repo', 'github');

// Get count by provider
const counts = await RepositoryService.getCountByProvider();
// Returns: { github: 5, gitlab: 3 }
```

## Build Service

Located: `lib/services/supabase-build-service.ts`

### Methods

#### Create
```typescript
await BuildService.create({
  repositoryId: 'repo-id',
  branch: 'main',
  commit: 'abc123',
  imageName: 'my-app',
  imageTag: 'latest',
  status: 'pending',
  output: 'Build started...\n'
});
```

#### Read
```typescript
// Get all builds
const all = await BuildService.getAll();

// Get recent builds (limit 10)
const recent = await BuildService.getRecent(10);

// Get by ID
const build = await BuildService.getById('build-id');

// Get by repository
const repoBuilds = await BuildService.getByRepository('repo-id');

// Get by status
const successBuilds = await BuildService.getByStatus('success');

// Get active builds (pending or building)
const active = await BuildService.getActive();

// Get latest build for repository
const latest = await BuildService.getLatestForRepository('repo-id');
```

#### Update
```typescript
// Update build status
await BuildService.updateStatus('build-id', 'building', 'Cloning repo...\n');

// Append to output
await BuildService.appendOutput('build-id', 'Building image...\n');

// Update build
await BuildService.update('build-id', {
  imageTag: 'v1.0.0'
});
```

#### Delete
```typescript
// Delete single build
await BuildService.delete('build-id');

// Delete old builds (older than 30 days)
const deletedCount = await BuildService.deleteOlderThan(30);
```

#### Statistics
```typescript
// Get overall statistics
const stats = await BuildService.getStats();
// Returns: { total, pending, building, success, failed, averageDuration }

// Get stats for specific repository
const repoStats = await BuildService.getStatsByRepository('repo-id');

// Get build duration
const duration = BuildService.getBuildDuration(build);
// Returns duration in seconds
```

## API Routes

### Repositories

#### GET /api/repositories
Get all repositories with optional filters:
```typescript
// Get all
fetch('/api/repositories')

// Get by provider
fetch('/api/repositories?provider=github')

// Search
fetch('/api/repositories?search=my-app')

// With statistics
fetch('/api/repositories?withStats=true')
```

#### POST /api/repositories
Create a new repository:
```typescript
fetch('/api/repositories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'github',
    name: 'my-app',
    fullName: 'username/my-app',
    defaultBranch: 'main',
    dockerfilePath: 'Dockerfile',
    repositoryUrl: 'https://github.com/username/my-app.git'
  })
})
```

#### GET /api/repositories/[id]
Get a specific repository:
```typescript
fetch('/api/repositories/repo-id')
```

#### PATCH /api/repositories/[id]
Update a repository:
```typescript
fetch('/api/repositories/repo-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dockerfilePath: 'docker/Dockerfile'
  })
})
```

#### DELETE /api/repositories/[id]
Delete a repository:
```typescript
fetch('/api/repositories/repo-id', {
  method: 'DELETE'
})
```

### Builds

#### GET /api/builds/stats
Get build statistics:
```typescript
// Overall stats
fetch('/api/builds/stats')

// Stats for specific repository
fetch('/api/builds/stats?repositoryId=repo-id')
```

### OAuth Settings

#### GET /api/settings/oauth
Get OAuth configuration (secrets masked):
```typescript
fetch('/api/settings/oauth')
```

#### POST /api/settings/oauth
Save OAuth configuration:
```typescript
fetch('/api/settings/oauth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    github: {
      clientId: 'id',
      clientSecret: 'secret',
      enabled: true
    }
  })
})
```

## Usage Examples

### Complete Build Workflow

```typescript
import { OAuthService } from '@/lib/services/supabase-oauth-service';
import { RepositoryService } from '@/lib/services/supabase-repository-service';
import { BuildService } from '@/lib/services/supabase-build-service';

async function runBuild() {
  // 1. Check OAuth is configured
  const oauth = await OAuthService.getByProvider('github');
  if (!oauth?.enabled) {
    throw new Error('GitHub OAuth not configured');
  }

  // 2. Get or create repository
  let repo = await RepositoryService.getById('repo-id');
  if (!repo) {
    repo = await RepositoryService.create({
      provider: 'github',
      name: 'my-app',
      fullName: 'username/my-app',
      defaultBranch: 'main',
      dockerfilePath: 'Dockerfile',
      repositoryUrl: 'https://github.com/username/my-app.git'
    });
  }

  // 3. Create build
  const build = await BuildService.create({
    repositoryId: repo.id!,
    branch: 'main',
    commit: 'abc123',
    imageName: 'my-app',
    imageTag: 'latest',
    status: 'pending',
    output: ''
  });

  // 4. Update as build progresses
  await BuildService.updateStatus(build.id!, 'building');
  await BuildService.appendOutput(build.id!, 'Cloning repository...\n');
  await BuildService.appendOutput(build.id!, 'Building Docker image...\n');

  // 5. Complete build
  await BuildService.updateStatus(build.id!, 'success');

  return build;
}
```

### Dashboard Data

```typescript
async function getDashboardData() {
  const [repos, builds, stats, oauth] = await Promise.all([
    RepositoryService.getAllWithStats(),
    BuildService.getRecent(10),
    BuildService.getStats(),
    OAuthService.getAllMasked()
  ]);

  return { repos, builds, stats, oauth };
}
```

### Cleanup Old Data

```typescript
async function cleanup() {
  // Delete builds older than 90 days
  const deleted = await BuildService.deleteOlderThan(90);
  console.log(`Deleted ${deleted} old builds`);

  // Find and delete unused repositories
  const repos = await RepositoryService.getAllWithStats();
  const unused = repos.filter(r => r.buildCount === 0);
  
  if (unused.length > 0) {
    await RepositoryService.deleteMany(unused.map(r => r.id!));
  }
}
```

## Best Practices

### 1. Error Handling
Always wrap service calls in try-catch:
```typescript
try {
  const repo = await RepositoryService.create(data);
} catch (error) {
  console.error('Failed to create repository:', error);
  // Handle error appropriately
}
```

### 2. Authentication
Check authentication before database operations:
```typescript
const session = await getServerSession();
if (!session) {
  throw new Error('Unauthorized');
}
```

### 3. Validation
Validate data before creating/updating:
```typescript
if (!data.provider || !data.name) {
  throw new Error('Missing required fields');
}
```

### 4. Batch Operations
Use Promise.all for parallel operations:
```typescript
const [repos, builds] = await Promise.all([
  RepositoryService.getAll(),
  BuildService.getRecent(10)
]);
```

### 5. Cleanup
Regularly clean up old data:
```typescript
// Run daily
await BuildService.deleteOlderThan(90);
```

## Testing

Test your CRUD operations:
```bash
# Run the test examples
node -r tsx examples/crud-examples.ts
```

## Troubleshooting

### "relation does not exist"
→ Run the SQL setup script in Supabase SQL Editor

### "Unauthorized" errors
→ Check if user is authenticated with NextAuth

### "Failed to encrypt/decrypt"
→ Verify NEXTAUTH_SECRET is set in .env

### Connection errors
→ Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

## Next Steps

1. ✅ Services are ready to use
2. ✅ API routes are created
3. ✅ Examples are provided
4. Start building your UI components!

See `examples/crud-examples.ts` for more detailed examples.
