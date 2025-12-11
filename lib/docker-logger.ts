/**
 * Docker-specific logging utilities
 * Provides enhanced logging for Docker operations with context
 */

import { logger, LogContext } from './logger';
import { formatBytes, formatDuration } from './config/logging';

export interface DockerOperationContext extends LogContext {
  operation: string;
  resource: string;
  resourceId?: string;
  resourceName?: string;
}

export class DockerLogger {
  /**
   * Log Docker container operations
   */
  static container = {
    list: (context?: LogContext, metadata?: { showAll?: boolean; count?: number }) => {
      logger.dockerOperation('list', 'containers', undefined, {
        ...context,
        ...metadata
      });
    },

    create: (containerId: string, name: string, image: string, context?: LogContext) => {
      logger.dockerOperation('create', 'container', containerId, {
        ...context,
        containerId,
        containerName: name,
        image
      });
    },

    start: (containerId: string, name?: string, context?: LogContext) => {
      logger.dockerOperation('start', 'container', containerId, {
        ...context,
        containerId,
        containerName: name
      });
    },

    stop: (containerId: string, name?: string, context?: LogContext) => {
      logger.dockerOperation('stop', 'container', containerId, {
        ...context,
        containerId,
        containerName: name
      });
    },

    remove: (containerId: string, name?: string, force?: boolean, context?: LogContext) => {
      logger.dockerOperation('remove', 'container', containerId, {
        ...context,
        containerId,
        containerName: name,
        force
      });
    },

    inspect: (containerId: string, context?: LogContext) => {
      logger.dockerOperation('inspect', 'container', containerId, {
        ...context,
        containerId
      });
    },

    logs: (containerId: string, lines?: number, context?: LogContext) => {
      logger.dockerOperation('logs', 'container', containerId, {
        ...context,
        containerId,
        lines
      });
    },

    stats: (containerId: string, context?: LogContext) => {
      logger.dockerOperation('stats', 'container', containerId, {
        ...context,
        containerId
      });
    }
  };

  /**
   * Log Docker image operations
   */
  static image = {
    list: (context?: LogContext, metadata?: { showAll?: boolean; count?: number }) => {
      logger.dockerOperation('list', 'images', undefined, {
        ...context,
        ...metadata
      });
    },

    pull: (imageName: string, tag?: string, context?: LogContext) => {
      const fullName = tag ? `${imageName}:${tag}` : imageName;
      logger.dockerOperation('pull', 'image', fullName, {
        ...context,
        imageName: fullName
      });
    },

    build: (imageName: string, context?: LogContext, metadata?: { dockerfile?: string; buildContext?: string }) => {
      logger.dockerOperation('build', 'image', imageName, {
        ...context,
        imageName,
        ...metadata
      });
    },

    remove: (imageId: string, force?: boolean, context?: LogContext) => {
      logger.dockerOperation('remove', 'image', imageId, {
        ...context,
        imageId,
        force
      });
    },

    inspect: (imageId: string, context?: LogContext) => {
      logger.dockerOperation('inspect', 'image', imageId, {
        ...context,
        imageId
      });
    },

    tag: (imageId: string, repository: string, tag: string, context?: LogContext) => {
      logger.dockerOperation('tag', 'image', imageId, {
        ...context,
        imageId,
        repository,
        tag
      });
    }
  };

  /**
   * Log Docker volume operations
   */
  static volume = {
    list: (context?: LogContext, metadata?: { count?: number }) => {
      logger.dockerOperation('list', 'volumes', undefined, {
        ...context,
        ...metadata
      });
    },

    create: (volumeName: string, driver?: string, context?: LogContext) => {
      logger.dockerOperation('create', 'volume', volumeName, {
        ...context,
        volumeName,
        driver
      });
    },

    remove: (volumeName: string, force?: boolean, context?: LogContext) => {
      logger.dockerOperation('remove', 'volume', volumeName, {
        ...context,
        volumeName,
        force
      });
    },

    inspect: (volumeName: string, context?: LogContext) => {
      logger.dockerOperation('inspect', 'volume', volumeName, {
        ...context,
        volumeName
      });
    }
  };

  /**
   * Log Docker network operations
   */
  static network = {
    list: (context?: LogContext, metadata?: { count?: number }) => {
      logger.dockerOperation('list', 'networks', undefined, {
        ...context,
        ...metadata
      });
    },

    create: (networkName: string, driver?: string, context?: LogContext) => {
      logger.dockerOperation('create', 'network', networkName, {
        ...context,
        networkName,
        driver
      });
    },

    remove: (networkName: string, context?: LogContext) => {
      logger.dockerOperation('remove', 'network', networkName, {
        ...context,
        networkName
      });
    },

    inspect: (networkName: string, context?: LogContext) => {
      logger.dockerOperation('inspect', 'network', networkName, {
        ...context,
        networkName
      });
    },

    connect: (networkName: string, containerId: string, context?: LogContext) => {
      logger.dockerOperation('connect', 'network', networkName, {
        ...context,
        networkName,
        containerId
      });
    },

    disconnect: (networkName: string, containerId: string, context?: LogContext) => {
      logger.dockerOperation('disconnect', 'network', networkName, {
        ...context,
        networkName,
        containerId
      });
    }
  };

  /**
   * Log Docker system operations
   */
  static system = {
    info: (context?: LogContext) => {
      logger.dockerOperation('info', 'system', undefined, context);
    },

    version: (context?: LogContext) => {
      logger.dockerOperation('version', 'system', undefined, context);
    },

    ping: (context?: LogContext) => {
      logger.dockerOperation('ping', 'system', undefined, context);
    },

    prune: (type: 'containers' | 'images' | 'volumes' | 'networks' | 'system', context?: LogContext) => {
      logger.dockerOperation('prune', type, undefined, {
        ...context,
        pruneType: type
      });
    },

    df: (context?: LogContext, metadata?: { totalSize?: number; reclaimableSize?: number }) => {
      logger.dockerOperation('df', 'system', undefined, {
        ...context,
        ...metadata
      });
    }
  };

  /**
   * Log performance metrics for Docker operations
   */
  static performance = {
    operation: (operation: string, resource: string, duration: number, context?: LogContext, metadata?: any) => {
      logger.performance(`docker.${operation}.${resource}`, duration, {
        ...context,
        dockerOperation: operation,
        dockerResource: resource,
        formattedDuration: formatDuration(duration),
        ...metadata
      });
    },

    dataTransfer: (operation: string, bytes: number, duration: number, context?: LogContext) => {
      const throughput = bytes / (duration / 1000); // bytes per second
      logger.performance(`docker.${operation}.transfer`, duration, {
        ...context,
        bytes,
        formattedSize: formatBytes(bytes),
        throughputBps: throughput,
        formattedThroughput: `${formatBytes(throughput)}/s`
      });
    }
  };

  /**
   * Log Docker errors with enhanced context
   */
  static error = {
    operation: (operation: string, resource: string, error: Error, context?: LogContext, metadata?: any) => {
      logger.dockerError(operation, resource, error, {
        ...context,
        ...metadata,
        errorCode: (error as any).statusCode || (error as any).code,
        errorType: error.constructor.name
      });
    },

    connection: (error: Error, context?: LogContext) => {
      logger.error('Docker connection error', {
        ...context,
        operation: 'docker_connection'
      }, error, {
        dockerSocket: process.env.DOCKER_SOCKET,
        errorType: error.constructor.name
      });
    },

    timeout: (operation: string, resource: string, timeout: number, context?: LogContext) => {
      logger.error(`Docker operation timeout: ${operation} ${resource}`, {
        ...context,
        operation: `docker_${operation}_timeout`,
        resource,
        timeout,
        formattedTimeout: formatDuration(timeout)
      });
    }
  };
}