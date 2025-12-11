import fs from 'fs/promises';
import path from 'path';
import { SetupConfiguration, ConfigurationBackup } from '@/types/setup-config';
import { BackupError, ConfigurationError, createSetupError, ERROR_CODES } from '@/lib/errors/setup-errors';
import { generateBackupId, sanitizeConfigurationForLogging } from '@/lib/utils/setup-utils';

/**
 * Environment Manager Service
 * Handles reading, writing, and backing up environment configuration
 */

export class EnvironmentManager {
  private readonly envPath: string;
  private readonly backupDir: string;
  private dockerConfig?: SetupConfiguration; // Store config in memory for Docker

  constructor(envPath?: string, backupDir?: string) {
    // Use environment variable for config file path in Docker, fallback to default
    this.envPath = path.resolve(envPath || process.env.CONFIG_FILE_PATH || '.env');
    this.backupDir = path.resolve(backupDir || '.env-backups');
  }

  /**
   * Read current environment configuration
   */
  async readEnvironment(): Promise<Partial<SetupConfiguration>> {
    try {
      const envContent = await fs.readFile(this.envPath, 'utf-8');
      return this.parseEnvironmentContent(envContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty configuration
        return {};
      }
      throw createSetupError(
        ERROR_CODES.FILE_ACCESS_ERROR,
        `Failed to read environment file: ${(error as Error).message}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Write configuration to environment file
   */
  async writeEnvironment(config: SetupConfiguration): Promise<void> {
    const isDocker = process.env.NODE_ENV === 'production' && process.env.HOSTNAME === '0.0.0.0';
    
    try {
      // In Docker, we'll use a different approach since file writing might have permission issues
      if (isDocker) {
        console.log('[EnvironmentManager] Docker environment detected - using alternative configuration storage');
        
        // Try to create backup (but don't fail if it doesn't work)
        try {
          await this.createBackup('Pre-configuration backup');
        } catch (backupError) {
          console.warn('[EnvironmentManager] Backup failed in Docker, continuing...', backupError);
        }

        // Try to write to file, but don't fail if permissions are denied
        try {
          const envContent = this.generateEnvironmentContent(config);
          await fs.writeFile(this.envPath, envContent, { 
            encoding: 'utf-8',
            mode: 0o644 
          });
          console.log('[EnvironmentManager] Configuration written successfully to:', this.envPath);
        } catch (writeError) {
          console.warn('[EnvironmentManager] File write failed in Docker, configuration saved in memory:', writeError);
          // In Docker, we can rely on environment variables from docker-compose.yml
          // Store configuration in a temporary location or memory for this session
          this.dockerConfig = config;
        }
      } else {
        // Normal file writing for development
        await this.createBackup('Pre-configuration backup');
        const envContent = this.generateEnvironmentContent(config);
        
        const envDir = path.dirname(this.envPath);
        await fs.mkdir(envDir, { recursive: true });
        
        await fs.writeFile(this.envPath, envContent, { 
          encoding: 'utf-8',
          mode: 0o644 
        });

        console.log('[EnvironmentManager] Configuration written successfully to:', this.envPath);
      }
    } catch (error) {
      const errorMessage = `Failed to write environment file: ${(error as Error).message}`;
      console.error('[EnvironmentManager]', errorMessage, {
        envPath: this.envPath,
        error: error,
        isDocker
      });
      
      // In Docker, don't throw error if it's just a permission issue
      if (isDocker && (error as any).code === 'EACCES') {
        console.log('[EnvironmentManager] Permission denied in Docker - configuration handled via environment variables');
        return;
      }
      
      throw createSetupError(
        ERROR_CODES.FILE_ACCESS_ERROR,
        errorMessage,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Update partial configuration while preserving existing values
   */
  async updateEnvironment(partialConfig: Partial<SetupConfiguration>): Promise<void> {
    try {
      const currentConfig = await this.readEnvironment();
      const mergedConfig = this.mergeConfigurations(currentConfig, partialConfig);
      
      // Validate that we have a complete configuration
      if (!this.isCompleteConfiguration(mergedConfig)) {
        throw createSetupError(
          ERROR_CODES.INVALID_CONFIGURATION,
          'Cannot update environment with incomplete configuration'
        );
      }

      await this.writeEnvironment(mergedConfig as SetupConfiguration);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot update environment')) {
        throw error;
      }
      throw createSetupError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `Failed to update environment: ${(error as Error).message}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Create a backup of the current configuration
   */
  async createBackup(description?: string): Promise<string> {
    try {
      // Ensure backup directory exists with proper permissions
      await fs.mkdir(this.backupDir, { recursive: true, mode: 0o755 });

      const currentConfig = await this.readEnvironment();
      const backupId = generateBackupId();
      const backup: ConfigurationBackup = {
        id: backupId,
        timestamp: new Date(),
        configuration: currentConfig as SetupConfiguration,
        description,
      };

      const backupPath = path.join(this.backupDir, `${backupId}.json`);
      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), { 
        encoding: 'utf-8',
        mode: 0o644 
      });

      console.log(`[EnvironmentManager] Backup created: ${backupId}`);
      return backupId;
    } catch (error) {
      console.warn(`[EnvironmentManager] Failed to create backup: ${(error as Error).message}`);
      // Don't throw error for backup failures in Docker environment
      if (process.env.NODE_ENV === 'production') {
        return 'backup-failed';
      }
      throw new BackupError(
        `Failed to create backup: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Restore configuration from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.json`);
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backup: ConfigurationBackup = JSON.parse(backupContent);

      await this.writeEnvironment(backup.configuration);
      console.log(`[EnvironmentManager] Configuration restored from backup: ${backupId}`);
    } catch (error) {
      throw new BackupError(
        `Failed to restore from backup ${backupId}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<ConfigurationBackup[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: ConfigurationBackup[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const backupPath = path.join(this.backupDir, file);
            const content = await fs.readFile(backupPath, 'utf-8');
            const backup: ConfigurationBackup = JSON.parse(content);
            backups.push(backup);
          } catch (error) {
            console.warn(`[EnvironmentManager] Failed to read backup file ${file}:`, error);
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // No backup directory exists yet
      }
      throw new BackupError(
        `Failed to list backups: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironment(): Promise<{ isValid: boolean; conflicts: string[] }> {
    try {
      const config = await this.readEnvironment();
      const conflicts: string[] = [];

      // Check for configuration conflicts
      if (config.auth?.nextAuthUrl && config.application?.appUrl) {
        if (config.auth.nextAuthUrl !== config.application.appUrl) {
          conflicts.push('NextAuth URL and Application URL mismatch');
        }
      }

      // Check OAuth callback URLs
      if (config.oauth?.github?.callbackUrl && config.application?.appUrl) {
        const expectedCallback = `${config.application.appUrl}/api/git/callback/github`;
        if (config.oauth.github.callbackUrl !== expectedCallback) {
          conflicts.push('GitHub OAuth callback URL mismatch');
        }
      }

      if (config.oauth?.gitlab?.callbackUrl && config.application?.appUrl) {
        const expectedCallback = `${config.application.appUrl}/api/git/callback/gitlab`;
        if (config.oauth.gitlab.callbackUrl !== expectedCallback) {
          conflicts.push('GitLab OAuth callback URL mismatch');
        }
      }

      return {
        isValid: conflicts.length === 0,
        conflicts,
      };
    } catch (error) {
      throw createSetupError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `Failed to validate environment: ${(error as Error).message}`,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Parse environment file content into configuration object
   */
  private parseEnvironmentContent(content: string): Partial<SetupConfiguration> {
    const lines = content.split('\n');
    const env: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    return {
      docker: {
        socket: env.DOCKER_SOCKET || '',
      },
      auth: {
        nextAuthUrl: env.NEXTAUTH_URL || '',
        nextAuthSecret: env.NEXTAUTH_SECRET || '',
      },
      oauth: {
        ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }),
        ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
            callbackUrl: env.GITHUB_CALLBACK_URL,
          },
        }),
        ...(env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET && {
          gitlab: {
            clientId: env.GITLAB_CLIENT_ID,
            clientSecret: env.GITLAB_CLIENT_SECRET,
            callbackUrl: env.GITLAB_CALLBACK_URL,
          },
        }),
      },
      database: {
        url: env.DATABASE_URL || '',
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || '',
      },
      application: {
        appUrl: env.NEXT_PUBLIC_APP_URL || '',
        adminEmails: env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [],
      },
      logging: {
        level: env.LOG_LEVEL || 'INFO',
        enableRequestLogging: env.ENABLE_REQUEST_LOGGING === 'true',
        enablePerformanceLogging: env.ENABLE_PERFORMANCE_LOGGING === 'true',
        enableDockerLogging: env.ENABLE_DOCKER_LOGGING === 'true',
        format: env.LOG_FORMAT || 'pretty',
        maxLogSize: parseInt(env.MAX_LOG_SIZE || '10485760'),
        retentionDays: parseInt(env.LOG_RETENTION_DAYS || '30'),
      },
    };
  }

  /**
   * Generate environment file content from configuration object
   */
  private generateEnvironmentContent(config: SetupConfiguration): string {
    const lines: string[] = [];

    // Docker Configuration
    lines.push('# Docker Configuration');
    lines.push(`DOCKER_SOCKET=${config.docker.socket}`);
    lines.push('');

    // NextAuth Configuration
    lines.push('# NextAuth Configuration');
    lines.push(`NEXTAUTH_URL=${config.auth.nextAuthUrl}`);
    lines.push(`NEXTAUTH_SECRET=${config.auth.nextAuthSecret}`);
    lines.push('');

    // Logging Configuration
    lines.push('# Logging Configuration');
    lines.push(`LOG_LEVEL=${config.logging.level}`);
    lines.push(`ENABLE_REQUEST_LOGGING=${config.logging.enableRequestLogging}`);
    lines.push(`ENABLE_PERFORMANCE_LOGGING=${config.logging.enablePerformanceLogging}`);
    lines.push(`ENABLE_DOCKER_LOGGING=${config.logging.enableDockerLogging}`);
    lines.push(`LOG_FORMAT=${config.logging.format}`);
    lines.push(`MAX_LOG_SIZE=${config.logging.maxLogSize}`);
    lines.push(`LOG_RETENTION_DAYS=${config.logging.retentionDays}`);
    lines.push('');

    // Google OAuth
    if (config.oauth.google) {
      lines.push('# Google OAuth');
      lines.push(`GOOGLE_CLIENT_ID=${config.oauth.google.clientId}`);
      lines.push(`GOOGLE_CLIENT_SECRET=${config.oauth.google.clientSecret}`);
      lines.push('');
    }

    // GitHub OAuth
    if (config.oauth.github) {
      lines.push('# GitHub OAuth (optional - for Git integration and building images from repositories)');
      lines.push('# NOTE: These can now be configured via Settings UI instead of .env');
      lines.push('# See docs/OAUTH_MIGRATION.md for details');
      lines.push('# QUICK FIX: Add your GitHub OAuth credentials here to bypass database setup');
      lines.push(`GITHUB_CLIENT_ID=${config.oauth.github.clientId}`);
      lines.push(`GITHUB_CLIENT_SECRET=${config.oauth.github.clientSecret}`);
      if (config.oauth.github.callbackUrl) {
        lines.push(`GITHUB_CALLBACK_URL=${config.oauth.github.callbackUrl}`);
      }
      lines.push('');
    }

    // GitLab OAuth
    if (config.oauth.gitlab) {
      lines.push('# GitLab OAuth (optional - for Git integration and building images from repositories)');
      lines.push('# NOTE: These can now be configured via Settings UI instead of .env');
      lines.push('# See docs/OAUTH_MIGRATION.md for details');
      lines.push(`GITLAB_CLIENT_ID=${config.oauth.gitlab.clientId}`);
      lines.push(`GITLAB_CLIENT_SECRET=${config.oauth.gitlab.clientSecret}`);
      if (config.oauth.gitlab.callbackUrl) {
        lines.push(`GITLAB_CALLBACK_URL=${config.oauth.gitlab.callbackUrl}`);
      }
      lines.push('');
    }

    // Application
    lines.push('# Application');
    lines.push(`NEXT_PUBLIC_APP_URL=${config.application.appUrl}`);
    lines.push('');

    // Database - Supabase
    lines.push('# Database - Supabase');
    lines.push('# Password URL encoded: ');
    lines.push(`DATABASE_URL=${config.database.url}`);
    lines.push(`NEXT_PUBLIC_SUPABASE_URL=${config.database.supabaseUrl}`);
    lines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.database.supabaseAnonKey}`);
    lines.push('# Get this from: https://YOUR_PROJECT.supabase.co -> Settings -> API');
    lines.push('# Use either the legacy "service_role" key OR the new "secret key" (both work)');
    lines.push(`SUPABASE_SERVICE_ROLE_KEY=${config.database.supabaseServiceKey}`);
    lines.push('# OR use the new secret key format:');
    lines.push('# SUPABASE_SECRET_KEY=');
    
    if (config.application.adminEmails.length > 0) {
      lines.push(`ADMIN_EMAILS=${config.application.adminEmails.join(',')}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Merge two configuration objects, with the second taking precedence
   */
  private mergeConfigurations(
    base: Partial<SetupConfiguration>,
    update: Partial<SetupConfiguration>
  ): Partial<SetupConfiguration> {
    return {
      docker: { ...base.docker, ...update.docker },
      auth: { ...base.auth, ...update.auth },
      oauth: {
        ...base.oauth,
        ...update.oauth,
        google: { ...base.oauth?.google, ...update.oauth?.google },
        github: { ...base.oauth?.github, ...update.oauth?.github },
        gitlab: { ...base.oauth?.gitlab, ...update.oauth?.gitlab },
      },
      database: { ...base.database, ...update.database },
      application: { 
        ...base.application, 
        ...update.application,
        adminEmails: update.application?.adminEmails || base.application?.adminEmails || [],
      },
      logging: { ...base.logging, ...update.logging },
    };
  }

  /**
   * Check if configuration is complete
   */
  private isCompleteConfiguration(config: Partial<SetupConfiguration>): config is SetupConfiguration {
    return !!(
      config.docker?.socket &&
      config.auth?.nextAuthUrl &&
      config.auth?.nextAuthSecret &&
      config.database?.url &&
      config.database?.supabaseUrl &&
      config.database?.supabaseAnonKey &&
      config.database?.supabaseServiceKey &&
      config.application?.appUrl &&
      config.logging?.level
    );
  }
}

// Export singleton instance
export const environmentManager = new EnvironmentManager();