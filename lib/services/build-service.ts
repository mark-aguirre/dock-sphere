import { Octokit } from '@octokit/rest';
import { Gitlab } from '@gitbeaker/node';
import simpleGit from 'simple-git';
import { docker } from '@/lib/docker';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getOAuthConfig } from '@/lib/oauth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';

interface Repository {
  id: string;
  provider: 'github' | 'gitlab';
  name: string;
  fullName: string;
  defaultBranch: string;
  dockerfilePath: string;
  repositoryUrl: string;
}

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

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'default-key-change-me';

function encryptToken(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(text: string): string {
  if (!text || text === '') return '';
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')),
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    return '';
  }
}

class BuildService {
  private repositories: Map<string, Repository> = new Map();
  private builds: Map<string, Build> = new Map();
  private buildDir = path.join(process.cwd(), '.builds');

  constructor() {
    this.ensureBuildDir();
  }

  private async ensureBuildDir() {
    try {
      await fs.mkdir(this.buildDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create build directory:', error);
    }
  }

  private async getToken(provider: string): Promise<string | null> {
    try {
      const session = await getServerSession();
      if (!session?.user) {
        console.log('[BuildService] No session found');
        return null;
      }

      // Use the session user ID directly (from JWT token)
      const userId = (session.user as any).id || session.user.email;
      if (!userId) {
        console.log('[BuildService] No user ID in session');
        return null;
      }

      const { data: tokenData, error } = await supabaseAdmin
        .from('GitProviderToken')
        .select('accessToken')
        .eq('userId', userId)
        .eq('provider', provider)
        .single();

      if (error) {
        console.log(`[BuildService] No token found for provider: ${provider}`, error.message);
        return null;
      }

      if (!tokenData) {
        console.log(`[BuildService] No token found for provider: ${provider}`);
        return null;
      }

      return decryptToken(tokenData.accessToken);
    } catch (error) {
      console.error('[BuildService] Error getting token:', error);
      return null;
    }
  }

  private async saveToken(provider: string, token: string): Promise<void> {
    try {
      const session = await getServerSession();
      if (!session?.user) {
        throw new Error('No session found');
      }

      // Use the session user ID directly (from JWT token)
      const userId = (session.user as any).id || session.user.email;
      if (!userId) {
        throw new Error('No user ID in session');
      }

      console.log(`[BuildService] Saving token for user: ${userId}, provider: ${provider}`);

      const encryptedToken = encryptToken(token);

      // Upsert token
      const { error } = await supabaseAdmin
        .from('GitProviderToken')
        .upsert({
          userId,
          provider,
          accessToken: encryptedToken,
          updatedAt: new Date().toISOString(),
        }, {
          onConflict: 'userId,provider'
        });

      if (error) {
        console.error('[BuildService] Error saving token:', error);
        throw error;
      }

      console.log(`[BuildService] Token saved successfully for provider: ${provider}`);
    } catch (error) {
      console.error('[BuildService] Error in saveToken:', error);
      throw error;
    }
  }

  async checkAuthentication(provider: string): Promise<boolean> {
    const token = await this.getToken(provider);
    return !!token;
  }

  async getAuthUrl(provider: string): Promise<string> {
    console.log(`[BuildService] Getting auth URL for provider: ${provider}`);
    
    try {
      const config = await getOAuthConfig();
      console.log(`[BuildService] OAuth config retrieved:`, {
        hasGithub: !!config.github,
        hasGitlab: !!config.gitlab,
        githubEnabled: config.github?.enabled,
        gitlabEnabled: config.gitlab?.enabled,
      });
      
      const providerConfig = provider === 'github' ? config.github : config.gitlab;
      
      if (!providerConfig?.clientId || !providerConfig?.enabled) {
        console.error(`[BuildService] Provider not configured:`, {
          provider,
          hasConfig: !!providerConfig,
          hasClientId: !!providerConfig?.clientId,
          enabled: providerConfig?.enabled,
        });
        throw new Error(`${provider} OAuth not configured or disabled`);
      }

      const clientId = providerConfig.clientId;
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/builds/auth/${provider}/callback`;
      
      console.log(`[BuildService] Generating auth URL with redirectUri: ${redirectUri}`);

      if (provider === 'github') {
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;
      } else if (provider === 'gitlab') {
        return `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=api`;
      }

      throw new Error('Unsupported provider');
    } catch (error) {
      console.error(`[BuildService] Error in getAuthUrl:`, error);
      throw error;
    }
  }

  async handleAuthCallback(provider: string, code: string): Promise<void> {
    const config = await getOAuthConfig();
    const providerConfig = provider === 'github' ? config.github : config.gitlab;
    
    if (!providerConfig?.clientId || !providerConfig?.clientSecret || !providerConfig?.enabled) {
      throw new Error(`${provider} OAuth not configured or disabled`);
    }

    const clientId = providerConfig.clientId;
    const clientSecret = providerConfig.clientSecret;

    if (provider === 'github') {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        await this.saveToken(provider, data.access_token);
      } else {
        throw new Error('Failed to get access token');
      }
    } else if (provider === 'gitlab') {
      const response = await fetch('https://gitlab.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/builds/auth/${provider}/callback`,
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        await this.saveToken(provider, data.access_token);
      } else {
        throw new Error('Failed to get access token');
      }
    }
  }

  async fetchRepositories(provider: 'github' | 'gitlab'): Promise<any[]> {
    const token = await this.getToken(provider);
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (provider === 'github') {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      return data.map((repo) => ({
        id: repo.id.toString(),
        fullName: repo.full_name,
        name: repo.name,
        defaultBranch: repo.default_branch,
        url: repo.clone_url,
      }));
    } else if (provider === 'gitlab') {
      const gitlab = new Gitlab({ token });
      const projects = await gitlab.Projects.all({ membership: true, per_page: 100 });

      return projects.map((project: any) => ({
        id: project.id.toString(),
        fullName: project.path_with_namespace,
        name: project.name,
        defaultBranch: project.default_branch,
        url: project.http_url_to_repo,
      }));
    }

    return [];
  }

  async connectRepository(config: {
    provider: 'github' | 'gitlab';
    repositoryId: string;
    dockerfilePath: string;
  }): Promise<Repository> {
    const token = await this.getToken(config.provider);
    if (!token) {
      throw new Error('Not authenticated');
    }

    const repos = await this.fetchRepositories(config.provider);
    const repoData = repos.find((r) => r.id === config.repositoryId);

    if (!repoData) {
      throw new Error('Repository not found');
    }

    const repository: Repository = {
      id: uuidv4(),
      provider: config.provider,
      name: repoData.name,
      fullName: repoData.fullName,
      defaultBranch: repoData.defaultBranch,
      dockerfilePath: config.dockerfilePath,
      repositoryUrl: repoData.url,
    };

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('Repository')
      .insert({
        id: repository.id,
        provider: repository.provider,
        name: repository.name,
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
        dockerfilePath: repository.dockerfilePath,
        repositoryUrl: repository.repositoryUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[BuildService] Error saving repository to database:', error);
      throw new Error(`Failed to save repository: ${error.message}`);
    }

    console.log('[BuildService] Repository saved to database:', data);

    // Also keep in memory for backward compatibility
    this.repositories.set(repository.id, repository);
    return repository;
  }

  async listRepositories(): Promise<Repository[]> {
    // Fetch from database
    const { data, error } = await supabaseAdmin
      .from('Repository')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[BuildService] Error fetching repositories from database:', error);
      // Fallback to in-memory repositories
      return Array.from(this.repositories.values());
    }

    // Sync with in-memory cache
    if (data) {
      data.forEach((repo: any) => {
        this.repositories.set(repo.id, repo);
      });
    }

    return data || [];
  }

  async updateRepository(id: string, updates: Partial<Repository>): Promise<Repository> {
    // Update in database
    const { data, error } = await supabaseAdmin
      .from('Repository')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[BuildService] Error updating repository in database:', error);
      throw new Error(`Failed to update repository: ${error.message}`);
    }

    console.log('[BuildService] Repository updated in database:', data);

    // Update in-memory cache
    if (data) {
      this.repositories.set(id, data);
    }

    return data;
  }

  async deleteRepository(id: string): Promise<void> {
    // Delete from database
    const { error } = await supabaseAdmin
      .from('Repository')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[BuildService] Error deleting repository from database:', error);
      throw new Error(`Failed to delete repository: ${error.message}`);
    }

    console.log('[BuildService] Repository deleted from database:', id);

    // Also remove from memory
    this.repositories.delete(id);
  }

  async getRepositoryDetails(id: string): Promise<any> {
    // Try to get from database first
    const { data: repoData, error: repoError } = await supabaseAdmin
      .from('Repository')
      .select('*')
      .eq('id', id)
      .single();

    let repository: Repository | undefined;

    if (repoError || !repoData) {
      // Fallback to in-memory
      repository = this.repositories.get(id);
      if (!repository) {
        throw new Error('Repository not found');
      }
    } else {
      repository = repoData;
      // Update in-memory cache
      this.repositories.set(repository.id, repository);
    }

    const token = await this.getToken(repository.provider);
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (repository.provider === 'github') {
      const octokit = new Octokit({ auth: token });
      const [owner, repo] = repository.fullName.split('/');

      const [branchesData, tagsData] = await Promise.all([
        octokit.repos.listBranches({ owner, repo, per_page: 100 }),
        octokit.repos.listTags({ owner, repo, per_page: 100 }),
      ]);

      return {
        branches: branchesData.data.map((b) => b.name),
        tags: tagsData.data.map((t) => t.name),
        dockerfiles: ['Dockerfile'], // Could scan repo for Dockerfiles
        defaultBranch: repository.defaultBranch,
      };
    } else if (repository.provider === 'gitlab') {
      const gitlab = new Gitlab({ token });
      const projectId = repository.fullName;

      const [branches, tags] = await Promise.all([
        gitlab.Branches.all(projectId),
        gitlab.Tags.all(projectId),
      ]);

      return {
        branches: branches.map((b: any) => b.name),
        tags: tags.map((t: any) => t.name),
        dockerfiles: ['Dockerfile'],
        defaultBranch: repository.defaultBranch,
      };
    }

    throw new Error('Unsupported provider');
  }

  async buildImage(config: {
    repositoryId: string;
    branch?: string;
    tag?: string;
    dockerfilePath: string;
    imageName: string;
    imageTag: string;
    autoDeploy?: boolean;
  }): Promise<Build> {
    // Try to get from database first
    const { data: repoData, error: repoError } = await supabaseAdmin
      .from('Repository')
      .select('*')
      .eq('id', config.repositoryId)
      .single();

    let repository: Repository | undefined;

    if (repoError || !repoData) {
      // Fallback to in-memory
      repository = this.repositories.get(config.repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }
    } else {
      repository = repoData;
      // Update in-memory cache
      this.repositories.set(repository.id, repository);
    }

    const buildId = uuidv4();
    const buildPath = path.join(this.buildDir, buildId);

    const build: Build = {
      id: buildId,
      repositoryId: config.repositoryId,
      repository: repository.fullName,
      branch: config.branch || '',
      tag: config.tag,
      commit: '',
      imageName: config.imageName,
      imageTag: config.imageTag,
      status: 'pending',
      output: '',
      createdAt: new Date().toISOString(),
    };

    this.builds.set(buildId, build);

    // Validate early by doing a quick check
    try {
      await this.validateBuildConfig(repository, config);
    } catch (error: any) {
      build.status = 'failed';
      build.output = `Build validation failed: ${error.message}`;
      build.completedAt = new Date().toISOString();
      throw error;
    }

    // Start build in background
    this.executeBuild(build, repository, buildPath, config).catch((error) => {
      console.error('Build failed:', error);
      build.status = 'failed';
      build.output += `\nBuild failed: ${error.message}`;
      build.completedAt = new Date().toISOString();
    });

    return build;
  }

  private async validateBuildConfig(repository: Repository, config: any): Promise<void> {
    // Quick validation - clone and check for Dockerfile
    const tempId = uuidv4();
    const tempPath = path.join(this.buildDir, `temp-${tempId}`);
    
    try {
      const token = await this.getToken(repository.provider);
      if (!token) {
        throw new Error('Not authenticated. Please reconnect your Git provider.');
      }

      // Clone repository
      const git = simpleGit();
      const authUrl = repository.repositoryUrl.replace('https://', `https://oauth2:${token}@`);
      
      await git.clone(authUrl, tempPath, ['--depth', '1', '--branch', config.branch || repository.defaultBranch]);

      // Check if Dockerfile exists
      const dockerfilePath = path.join(tempPath, config.dockerfilePath);
      
      try {
        await fs.access(dockerfilePath);
      } catch (error) {
        // List available files to help user
        const files = await fs.readdir(tempPath);
        const dockerfiles = files.filter(f => f.toLowerCase().includes('dockerfile'));
        
        let errorMsg = `Dockerfile not found at path: "${config.dockerfilePath}"\n\n`;
        
        if (dockerfiles.length > 0) {
          errorMsg += `Found these Dockerfiles in the repository:\n${dockerfiles.map(f => `  • ${f}`).join('\n')}\n\n`;
          errorMsg += `Please update the Dockerfile path in repository settings to use one of these files.`;
        } else {
          errorMsg += `No Dockerfile found in repository root.\n\n`;
          errorMsg += `Available files: ${files.slice(0, 10).join(', ')}${files.length > 10 ? '...' : ''}\n\n`;
          errorMsg += `Please ensure your repository contains a Dockerfile or update the path in repository settings.`;
        }
        
        throw new Error(errorMsg);
      }

      // Cleanup temp directory
      await fs.rm(tempPath, { recursive: true, force: true });
    } catch (error: any) {
      // Cleanup on error
      try {
        await fs.rm(tempPath, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  private async executeBuild(
    build: Build,
    repository: Repository,
    buildPath: string,
    config: any
  ): Promise<void> {
    try {
      build.status = 'building';
      build.output = 'Starting build...\n';

      // Clone repository
      build.output += `Cloning repository ${repository.repositoryUrl}...\n`;
      const git = simpleGit();
      
      const token = await this.getToken(repository.provider);
      if (!token) {
        throw new Error('Not authenticated');
      }
      const authUrl = repository.repositoryUrl.replace('https://', `https://oauth2:${token}@`);
      
      await git.clone(authUrl, buildPath, ['--depth', '1', '--branch', config.branch || repository.defaultBranch]);
      build.output += 'Repository cloned successfully\n';

      // Get commit hash
      const repoGit = simpleGit(buildPath);
      const log = await repoGit.log(['-1']);
      build.commit = log.latest?.hash || 'unknown';
      build.output += `Building from commit: ${build.commit}\n`;

      // Validate Dockerfile exists
      const dockerfilePath = path.join(buildPath, config.dockerfilePath);
      build.output += `Checking for Dockerfile at: ${config.dockerfilePath}\n`;
      
      try {
        await fs.access(dockerfilePath);
        build.output += 'Dockerfile found\n';
      } catch (error) {
        // List available files to help user
        try {
          const files = await fs.readdir(buildPath);
          const dockerfiles = files.filter(f => f.toLowerCase().includes('dockerfile'));
          
          let errorMsg = `Dockerfile not found at path: ${config.dockerfilePath}\n`;
          errorMsg += `Available files in repository root: ${files.join(', ')}\n`;
          
          if (dockerfiles.length > 0) {
            errorMsg += `Found potential Dockerfiles: ${dockerfiles.join(', ')}\n`;
            errorMsg += `Please update the Dockerfile path in repository settings.\n`;
          } else {
            errorMsg += `No Dockerfile found in repository root. Please ensure your repository contains a Dockerfile.\n`;
          }
          
          throw new Error(errorMsg);
        } catch (listError) {
          throw new Error(`Dockerfile not found at path: ${config.dockerfilePath}. Please verify the Dockerfile path in repository settings.`);
        }
      }

      // Build Docker image
      build.output += `Building Docker image ${config.imageName}:${config.imageTag}...\n`;

      const stream = await docker.buildImage(
        {
          context: buildPath,
          src: ['.'],
        },
        {
          t: `${config.imageName}:${config.imageTag}`,
          dockerfile: config.dockerfilePath,
        }
      );

      // Capture build output
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(
          stream,
          (err: any, res: any) => (err ? reject(err) : resolve(res)),
          (event: any) => {
            if (event.stream) {
              build.output += event.stream;
            }
            if (event.error) {
              build.output += `ERROR: ${event.error}\n`;
            }
          }
        );
      });

      // Tag with commit hash
      const image = docker.getImage(`${config.imageName}:${config.imageTag}`);
      await image.tag({
        repo: config.imageName,
        tag: build.commit.substring(0, 7),
      });

      build.status = 'success';
      build.output += '\nBuild completed successfully!\n';
      build.completedAt = new Date().toISOString();

      // Auto-deploy if requested
      if (config.autoDeploy) {
        build.output += '\nAuto-deploying container...\n';
        await this.deployContainer(config.imageName, config.imageTag);
        build.output += 'Container deployed successfully!\n';
      }

      // Cleanup
      await fs.rm(buildPath, { recursive: true, force: true });
    } catch (error: any) {
      build.status = 'failed';
      build.output += `\nBuild failed: ${error.message}\n`;
      build.completedAt = new Date().toISOString();
      
      // Cleanup on failure
      try {
        await fs.rm(buildPath, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      
      throw error;
    }
  }

  private async deployContainer(imageName: string, imageTag: string): Promise<void> {
    const container = await docker.createContainer({
      Image: `${imageName}:${imageTag}`,
      name: `${imageName}-${Date.now()}`,
    });

    await container.start();
  }

  async listBuilds(): Promise<Build[]> {
    return Array.from(this.builds.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getBuild(id: string): Promise<Build | undefined> {
    return this.builds.get(id);
  }
}

export const buildService = new BuildService();
