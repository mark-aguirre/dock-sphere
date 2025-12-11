# Builds API Reference

Quick reference for the Builds feature API endpoints and client methods.

## API Client Methods

### Authentication

```typescript
// Check if authenticated with provider
apiClient.builds.checkAuth(provider: string)
// Returns: { authenticated: boolean }

// Get OAuth authentication URL
apiClient.builds.authenticate(provider: string)
// Returns: { authUrl: string }
```

### Repositories

```typescript
// Fetch repositories from provider (GitHub/GitLab)
apiClient.builds.fetchRepositories(provider: string)
// Returns: { repositories: Repository[] }

// List connected repositories
apiClient.builds.listRepositories()
// Returns: { repositories: Repository[] }

// Connect a repository
apiClient.builds.connectRepository(config: {
  provider: 'github' | 'gitlab',
  repositoryId: string,
  dockerfilePath: string
})
// Returns: { repository: Repository }

// Get repository details (branches, tags, dockerfiles)
apiClient.builds.getRepositoryDetails(id: string)
// Returns: {
//   branches: string[],
//   tags: string[],
//   dockerfiles: string[],
//   defaultBranch: string
// }

// Delete repository connection
apiClient.builds.deleteRepository(id: string)
// Returns: { success: boolean }
```

### Builds

```typescript
// List all builds
apiClient.builds.listBuilds()
// Returns: { builds: Build[] }

// Build Docker image from repository
apiClient.builds.buildImage(config: {
  repositoryId: string,
  branch?: string,
  tag?: string,
  dockerfilePath: string,
  imageName: string,
  imageTag: string,
  autoDeploy?: boolean
})
// Returns: { build: Build }
```

## API Endpoints

### Authentication Endpoints

#### Check Authentication
```
GET /api/builds/auth/[provider]
```
**Response**:
```json
{
  "authenticated": true
}
```

#### Get Auth URL
```
POST /api/builds/auth/[provider]
```
**Response**:
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?..."
}
```

#### OAuth Callback
```
GET /api/builds/auth/[provider]/callback?code=xxx
```
**Response**: Redirect to `/builds?success=authenticated`

### Repository Endpoints

#### List Connected Repositories
```
GET /api/builds/repositories
```
**Response**:
```json
{
  "repositories": [
    {
      "id": "uuid",
      "provider": "github",
      "name": "my-app",
      "fullName": "username/my-app",
      "defaultBranch": "main",
      "dockerfilePath": "Dockerfile",
      "repositoryUrl": "https://github.com/username/my-app.git"
    }
  ]
}
```

#### Connect Repository
```
POST /api/builds/repositories
Content-Type: application/json

{
  "provider": "github",
  "repositoryId": "123456",
  "dockerfilePath": "Dockerfile"
}
```
**Response**:
```json
{
  "repository": {
    "id": "uuid",
    "provider": "github",
    "name": "my-app",
    "fullName": "username/my-app",
    "defaultBranch": "main",
    "dockerfilePath": "Dockerfile",
    "repositoryUrl": "https://github.com/username/my-app.git"
  }
}
```

#### Fetch Repositories from Provider
```
GET /api/builds/repositories/fetch?provider=github
```
**Response**:
```json
{
  "repositories": [
    {
      "id": "123456",
      "fullName": "username/my-app",
      "name": "my-app",
      "defaultBranch": "main",
      "url": "https://github.com/username/my-app.git"
    }
  ]
}
```

#### Get Repository Details
```
GET /api/builds/repositories/[id]
```
**Response**:
```json
{
  "branches": ["main", "develop", "feature/new-feature"],
  "tags": ["v1.0.0", "v1.1.0"],
  "dockerfiles": ["Dockerfile", "Dockerfile.dev"],
  "defaultBranch": "main"
}
```

#### Delete Repository
```
DELETE /api/builds/repositories/[id]
```
**Response**:
```json
{
  "success": true
}
```

### Build Endpoints

#### List Builds
```
GET /api/builds
```
**Response**:
```json
{
  "builds": [
    {
      "id": "uuid",
      "repositoryId": "uuid",
      "repository": "username/my-app",
      "branch": "main",
      "tag": null,
      "commit": "abc123def456",
      "imageName": "my-app",
      "imageTag": "latest",
      "status": "success",
      "output": "Build output...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z"
    }
  ]
}
```

#### Build Image
```
POST /api/builds
Content-Type: application/json

{
  "repositoryId": "uuid",
  "branch": "main",
  "dockerfilePath": "Dockerfile",
  "imageName": "my-app",
  "imageTag": "latest",
  "autoDeploy": true
}
```
**Response**:
```json
{
  "build": {
    "id": "uuid",
    "repositoryId": "uuid",
    "repository": "username/my-app",
    "branch": "main",
    "commit": "",
    "imageName": "my-app",
    "imageTag": "latest",
    "status": "pending",
    "output": "",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Type Definitions

### Repository
```typescript
interface Repository {
  id: string;
  provider: 'github' | 'gitlab';
  name: string;
  fullName: string;
  defaultBranch: string;
  dockerfilePath: string;
  repositoryUrl: string;
}
```

### Build
```typescript
interface Build {
  id: string;
  repositoryId: string;
  repository: string;
  branch: string;
  tag?: string;
  commit: string;
  imageName: string;
  imageTag: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  output: string;
  createdAt: string;
  completedAt?: string;
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "suggestions": []
  }
}
```

### Common Error Codes

- `AUTH_CHECK_ERROR` - Failed to check authentication status
- `AUTH_URL_ERROR` - Failed to generate OAuth URL
- `FETCH_REPOSITORIES_ERROR` - Failed to fetch repositories from provider
- `REPOSITORY_LIST_ERROR` - Failed to list connected repositories
- `REPOSITORY_CONNECT_ERROR` - Failed to connect repository
- `REPOSITORY_DETAILS_ERROR` - Failed to get repository details
- `REPOSITORY_DELETE_ERROR` - Failed to delete repository
- `BUILD_LIST_ERROR` - Failed to list builds
- `BUILD_ERROR` - Failed to start build

## Usage Examples

### Complete Build Flow

```typescript
// 1. Check authentication
const authStatus = await apiClient.builds.checkAuth('github');

// 2. If not authenticated, get auth URL and redirect
if (!authStatus.authenticated) {
  const { authUrl } = await apiClient.builds.authenticate('github');
  window.location.href = authUrl;
  return;
}

// 3. Fetch repositories from provider
const { repositories } = await apiClient.builds.fetchRepositories('github');

// 4. Connect a repository
const { repository } = await apiClient.builds.connectRepository({
  provider: 'github',
  repositoryId: repositories[0].id,
  dockerfilePath: 'Dockerfile'
});

// 5. Get repository details
const details = await apiClient.builds.getRepositoryDetails(repository.id);

// 6. Build image
const { build } = await apiClient.builds.buildImage({
  repositoryId: repository.id,
  branch: details.defaultBranch,
  dockerfilePath: 'Dockerfile',
  imageName: 'my-app',
  imageTag: 'latest',
  autoDeploy: true
});

// 7. Check build status
const { builds } = await apiClient.builds.listBuilds();
const latestBuild = builds.find(b => b.id === build.id);
console.log(latestBuild.status); // 'pending', 'building', 'success', or 'failed'
```

### Error Handling

```typescript
try {
  await apiClient.builds.buildImage(config);
} catch (error) {
  if (error instanceof APIError) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Suggestions:', error.suggestions);
  }
}
```
