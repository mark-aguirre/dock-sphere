/**
 * Docker Configuration Utilities
 * Handles Docker-specific configuration adjustments
 */

import { SetupConfiguration } from '@/types/setup-config';

/**
 * Adjust configuration for Docker environment
 */
export function adjustConfigForDocker(config: SetupConfiguration): SetupConfiguration {
  const isDocker = process.env.NODE_ENV === 'production' && process.env.HOSTNAME === '0.0.0.0';
  
  if (!isDocker) {
    return config;
  }

  // Adjusting configuration for Docker environment

  return {
    ...config,
    docker: {
      ...config.docker,
      // Use appropriate socket for Docker container (Windows uses named pipe)
      socket: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock',
    },
    auth: {
      ...config.auth,
      // Ensure NextAuth URL uses correct port
      nextAuthUrl: config.auth.nextAuthUrl.replace(':3000', ':3009'),
    },
    oauth: {
      ...config.oauth,
      github: config.oauth.github ? {
        ...config.oauth.github,
        // Update GitHub callback URL for Docker port
        callbackUrl: config.oauth.github.callbackUrl?.replace(':3000', ':3009'),
      } : undefined,
      gitlab: config.oauth.gitlab ? {
        ...config.oauth.gitlab,
        // Update GitLab callback URL for Docker port
        callbackUrl: config.oauth.gitlab.callbackUrl?.replace(':3000', ':3009'),
      } : undefined,
    },
    application: {
      ...config.application,
      // Ensure app URL uses correct port
      appUrl: config.application.appUrl.replace(':3000', ':3009'),
    },
  };
}

/**
 * Check if running in Docker environment
 */
export function isDockerEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.HOSTNAME === '0.0.0.0';
}

/**
 * Get Docker-appropriate file paths
 */
export function getDockerFilePaths() {
  const isDocker = isDockerEnvironment();
  
  return {
    envPath: isDocker ? '/app/.env' : '.env',
    backupDir: isDocker ? '/app/.env-backups' : '.env-backups',
  };
}