/**
 * CRUD Examples for Supabase Services
 * 
 * This file demonstrates how to use the Supabase services
 * for OAuth providers, repositories, and builds.
 */

import { OAuthService } from '@/lib/services/supabase-oauth-service';
import { RepositoryService } from '@/lib/services/supabase-repository-service';
import { BuildService } from '@/lib/services/supabase-build-service';

// ============================================================================
// OAuth Provider CRUD Examples
// ============================================================================

export async function oauthExamples() {
  // CREATE - Add a new OAuth provider
  const newProvider = await OAuthService.create({
    provider: 'github',
    clientId: 'your-github-client-id',
    clientSecret: 'your-github-client-secret',
    enabled: true,
    callbackUrl: 'http://localhost:3000/api/builds/auth/github/callback',
  });
  console.log('Created provider:', newProvider);

  // READ - Get all OAuth providers
  const allProviders = await OAuthService.getAll();
  console.log('All providers:', allProviders);

  // READ - Get a specific provider
  const githubProvider = await OAuthService.getByProvider('github');
  console.log('GitHub provider:', githubProvider);

  // READ - Get only enabled providers
  const enabledProviders = await OAuthService.getEnabled();
  console.log('Enabled providers:', enabledProviders);

  // READ - Get masked providers for UI
  const maskedProviders = await OAuthService.getAllMasked();
  console.log('Masked providers:', maskedProviders);

  // UPDATE - Update provider settings
  const updated = await OAuthService.update('github', {
    clientId: 'new-client-id',
    enabled: false,
  });
  console.log('Updated provider:', updated);

  // UPDATE - Toggle enabled status
  await OAuthService.toggleEnabled('github', true);

  // UPSERT - Create or update
  const upserted = await OAuthService.upsert({
    provider: 'gitlab',
    clientId: 'gitlab-client-id',
    clientSecret: 'gitlab-secret',
    enabled: true,
  });
  console.log('Upserted provider:', upserted);

  // DELETE - Remove a provider
  await OAuthService.delete('github');
}

// ============================================================================
// Repository CRUD Examples
// ============================================================================

export async function repositoryExamples() {
  // CREATE - Add a new repository
  const newRepo = await RepositoryService.create({
    provider: 'github',
    name: 'my-app',
    fullName: 'username/my-app',
    defaultBranch: 'main',
    dockerfilePath: 'Dockerfile',
    repositoryUrl: 'https://github.com/username/my-app.git',
  });
  console.log('Created repository:', newRepo);

  // READ - Get all repositories
  const allRepos = await RepositoryService.getAll();
  console.log('All repositories:', allRepos);

  // READ - Get repositories with build statistics
  const reposWithStats = await RepositoryService.getAllWithStats();
  console.log('Repositories with stats:', reposWithStats);

  // READ - Get a specific repository
  const repo = await RepositoryService.getById(newRepo.id!);
  console.log('Repository:', repo);

  // READ - Get repositories by provider
  const githubRepos = await RepositoryService.getByProvider('github');
  console.log('GitHub repositories:', githubRepos);

  // READ - Search repositories
  const searchResults = await RepositoryService.search('my-app');
  console.log('Search results:', searchResults);

  // UPDATE - Update repository
  const updatedRepo = await RepositoryService.update(newRepo.id!, {
    dockerfilePath: 'docker/Dockerfile',
    defaultBranch: 'develop',
  });
  console.log('Updated repository:', updatedRepo);

  // UPDATE - Update dockerfile path
  await RepositoryService.updateDockerfilePath(newRepo.id!, 'Dockerfile.prod');

  // UTILITY - Check if repository exists
  const exists = await RepositoryService.exists('username/my-app', 'github');
  console.log('Repository exists:', exists);

  // UTILITY - Get count by provider
  const counts = await RepositoryService.getCountByProvider();
  console.log('Repository counts:', counts);

  // DELETE - Remove a repository
  await RepositoryService.delete(newRepo.id!);

  // DELETE - Remove multiple repositories
  await RepositoryService.deleteMany([newRepo.id!]);
}

// ============================================================================
// Build CRUD Examples
// ============================================================================

export async function buildExamples() {
  // Assume we have a repository ID
  const repositoryId = 'some-repo-id';

  // CREATE - Start a new build
  const newBuild = await BuildService.create({
    repositoryId,
    branch: 'main',
    commit: 'abc123def456',
    imageName: 'my-app',
    imageTag: 'latest',
    status: 'pending',
    output: 'Build started...\n',
  });
  console.log('Created build:', newBuild);

  // READ - Get all builds
  const allBuilds = await BuildService.getAll();
  console.log('All builds:', allBuilds);

  // READ - Get recent builds (limit 10)
  const recentBuilds = await BuildService.getRecent(10);
  console.log('Recent builds:', recentBuilds);

  // READ - Get a specific build
  const build = await BuildService.getById(newBuild.id!);
  console.log('Build:', build);

  // READ - Get builds by repository
  const repoBuilds = await BuildService.getByRepository(repositoryId);
  console.log('Repository builds:', repoBuilds);

  // READ - Get builds by status
  const successBuilds = await BuildService.getByStatus('success');
  console.log('Successful builds:', successBuilds);

  // READ - Get active builds (pending or building)
  const activeBuilds = await BuildService.getActive();
  console.log('Active builds:', activeBuilds);

  // UPDATE - Update build status
  await BuildService.updateStatus(newBuild.id!, 'building', 'Cloning repository...\n');

  // UPDATE - Append to build output
  await BuildService.appendOutput(newBuild.id!, 'Building Docker image...\n');

  // UPDATE - Complete build
  await BuildService.updateStatus(newBuild.id!, 'success', 'Build completed successfully!\n');

  // UPDATE - Update build
  await BuildService.update(newBuild.id!, {
    imageTag: 'v1.0.0',
  });

  // STATISTICS - Get overall build statistics
  const stats = await BuildService.getStats();
  console.log('Build statistics:', stats);
  // Output: { total: 100, pending: 5, building: 2, success: 80, failed: 13, averageDuration: 120 }

  // STATISTICS - Get stats for a specific repository
  const repoStats = await BuildService.getStatsByRepository(repositoryId);
  console.log('Repository build stats:', repoStats);

  // UTILITY - Get latest build for repository
  const latestBuild = await BuildService.getLatestForRepository(repositoryId);
  console.log('Latest build:', latestBuild);

  // UTILITY - Get build duration
  if (build) {
    const duration = BuildService.getBuildDuration(build);
    console.log('Build duration (seconds):', duration);
  }

  // DELETE - Remove a build
  await BuildService.delete(newBuild.id!);

  // DELETE - Remove old builds (older than 30 days)
  const deletedCount = await BuildService.deleteOlderThan(30);
  console.log('Deleted old builds:', deletedCount);
}

// ============================================================================
// Real-World Usage Examples
// ============================================================================

// Example: Complete build workflow
export async function buildWorkflowExample() {
  // 1. Check if OAuth is configured
  const githubOAuth = await OAuthService.getByProvider('github');
  if (!githubOAuth || !githubOAuth.enabled) {
    throw new Error('GitHub OAuth not configured');
  }

  // 2. Get or create repository
  const repoExists = await RepositoryService.exists('username/my-app', 'github');
  let repository;
  
  if (!repoExists) {
    repository = await RepositoryService.create({
      provider: 'github',
      name: 'my-app',
      fullName: 'username/my-app',
      defaultBranch: 'main',
      dockerfilePath: 'Dockerfile',
      repositoryUrl: 'https://github.com/username/my-app.git',
    });
  } else {
    const repos = await RepositoryService.search('username/my-app');
    repository = repos[0];
  }

  // 3. Create a new build
  const build = await BuildService.create({
    repositoryId: repository.id!,
    branch: 'main',
    commit: 'abc123',
    imageName: 'my-app',
    imageTag: 'latest',
    status: 'pending',
    output: '',
  });

  // 4. Update build status as it progresses
  await BuildService.updateStatus(build.id!, 'building');
  await BuildService.appendOutput(build.id!, 'Cloning repository...\n');
  await BuildService.appendOutput(build.id!, 'Building Docker image...\n');
  
  // 5. Complete the build
  await BuildService.updateStatus(build.id!, 'success', 'Build completed!\n');

  // 6. Get repository stats
  const stats = await BuildService.getStatsByRepository(repository.id!);
  console.log('Repository build stats:', stats);

  return build;
}

// Example: Dashboard data fetching
export async function dashboardDataExample() {
  // Get all data for dashboard
  const [
    repositories,
    recentBuilds,
    activeBuilds,
    buildStats,
    oauthProviders,
  ] = await Promise.all([
    RepositoryService.getAllWithStats(),
    BuildService.getRecent(10),
    BuildService.getActive(),
    BuildService.getStats(),
    OAuthService.getAllMasked(),
  ]);

  return {
    repositories,
    recentBuilds,
    activeBuilds,
    buildStats,
    oauthProviders,
  };
}

// Example: Cleanup old data
export async function cleanupExample() {
  // Delete builds older than 90 days
  const deletedBuilds = await BuildService.deleteOlderThan(90);
  console.log(`Deleted ${deletedBuilds} old builds`);

  // Get repositories with no builds
  const allRepos = await RepositoryService.getAllWithStats();
  const unusedRepos = allRepos.filter(repo => repo.buildCount === 0);
  
  // Optionally delete unused repositories
  if (unusedRepos.length > 0) {
    const ids = unusedRepos.map(repo => repo.id!);
    await RepositoryService.deleteMany(ids);
    console.log(`Deleted ${ids.length} unused repositories`);
  }
}
