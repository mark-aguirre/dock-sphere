import { 
  ContainerStats, 
  AggregateStats,
  ProcessedStats
} from '@/types/stats';
import { docker } from '@/lib/docker';
import { NotFoundError, DockerError } from '@/lib/errors';
import { WebSocket } from 'ws';

/**
 * Stats Service for real-time container statistics and monitoring
 */
export class StatsService {
  private streamingContainers: Map<string, any>;
  private streamIntervals: Map<string, NodeJS.Timeout>;

  constructor() {
    this.streamingContainers = new Map();
    this.streamIntervals = new Map();
  }

  /**
   * Get real-time statistics for a container
   */
  async streamStats(containerId: string, ws: WebSocket): Promise<void> {
    try {
      const container = docker.getContainer(containerId);
      
      // Verify container exists and is running
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        ws.send(JSON.stringify({
          event: 'stats-error',
          data: {
            error: 'Container is not running',
            containerId
          }
        }));
        return;
      }

      // Get container name
      const containerName = containerInfo.Name.replace('/', '');

      // Start streaming stats
      const statsStream = await container.stats({ stream: true });
      
      this.streamingContainers.set(containerId, statsStream);

      statsStream.on('data', (chunk: Buffer) => {
        try {
          const rawStats = JSON.parse(chunk.toString());
          const processed = this.processStats(rawStats);
          
          const stats: ContainerStats = {
            containerId,
            containerName,
            ...processed,
            timestamp: new Date()
          };

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'stats-update',
              data: stats
            }));
          }
        } catch (error) {
          console.error('Error processing stats:', error);
        }
      });

      statsStream.on('error', (error: Error) => {
        console.error('Stats stream error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            event: 'stats-error',
            data: { error: error.message, containerId }
          }));
        }
        this.stopStreaming(containerId);
      });

      // Handle WebSocket close
      ws.on('close', () => {
        this.stopStreaming(containerId);
      });

    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Container',
          containerId,
          ['Verify container ID']
        );
      }
      throw new DockerError(
        `Failed to stream stats: ${error.message}`,
        error,
        ['Check container is running']
      );
    }
  }

  /**
   * Get individual stats for all containers
   */
  async getAllContainerStats(): Promise<ContainerStats[]> {
    try {
      const containers = await docker.listContainers();
      const runningContainers = containers.filter(c => c.State === 'running');

      if (runningContainers.length === 0) {
        return [];
      }

      // Get stats for all running containers
      const statsPromises = runningContainers.map(async (containerInfo) => {
        try {
          const container = docker.getContainer(containerInfo.Id);
          const stats = await container.stats({ stream: false });
          const processed = this.processStats(stats);
          
          return {
            containerId: containerInfo.Id,
            containerName: containerInfo.Names[0]?.replace('/', '') || 'unknown',
            ...processed,
            timestamp: new Date()
          } as ContainerStats;
        } catch (error) {
          console.error(`Error getting stats for ${containerInfo.Id}:`, error);
          return null;
        }
      });

      const allStats = (await Promise.all(statsPromises)).filter(s => s !== null) as ContainerStats[];
      return allStats;
    } catch (error: any) {
      throw new DockerError(
        `Failed to get container stats: ${error.message}`,
        error,
        ['Check Docker is running']
      );
    }
  }

  /**
   * Get aggregate statistics for all running containers
   */
  async getAggregateStats(): Promise<AggregateStats> {
    try {
      const containers = await docker.listContainers();
      const runningContainers = containers.filter(c => c.State === 'running');

      if (runningContainers.length === 0) {
        return {
          totalContainers: containers.length,
          runningContainers: 0,
          totalCpuPercent: 0,
          totalMemoryUsage: 0,
          totalMemoryLimit: 0,
          totalNetworkRx: 0,
          totalNetworkTx: 0
        };
      }

      // Get stats for all running containers
      const statsPromises = runningContainers.map(async (containerInfo) => {
        try {
          const container = docker.getContainer(containerInfo.Id);
          const stats = await container.stats({ stream: false });
          return this.processStats(stats);
        } catch (error) {
          console.error(`Error getting stats for ${containerInfo.Id}:`, error);
          return null;
        }
      });

      const allStats = (await Promise.all(statsPromises)).filter(s => s !== null) as ProcessedStats[];

      // Aggregate the stats
      const aggregate = allStats.reduce(
        (acc, stats) => ({
          totalCpuPercent: acc.totalCpuPercent + stats.cpuPercent,
          totalMemoryUsage: acc.totalMemoryUsage + stats.memoryUsage,
          totalMemoryLimit: acc.totalMemoryLimit + stats.memoryLimit,
          totalNetworkRx: acc.totalNetworkRx + stats.networkRx,
          totalNetworkTx: acc.totalNetworkTx + stats.networkTx
        }),
        {
          totalCpuPercent: 0,
          totalMemoryUsage: 0,
          totalMemoryLimit: 0,
          totalNetworkRx: 0,
          totalNetworkTx: 0
        }
      );

      return {
        totalContainers: containers.length,
        runningContainers: runningContainers.length,
        ...aggregate
      };
    } catch (error: any) {
      throw new DockerError(
        `Failed to get aggregate stats: ${error.message}`,
        error,
        ['Check Docker is running']
      );
    }
  }

  /**
   * Stop streaming statistics
   */
  stopStreaming(containerId: string): void {
    const stream = this.streamingContainers.get(containerId);
    if (stream) {
      try {
        stream.destroy();
      } catch (error) {
        console.error('Error destroying stats stream:', error);
      }
      this.streamingContainers.delete(containerId);
    }

    const interval = this.streamIntervals.get(containerId);
    if (interval) {
      clearInterval(interval);
      this.streamIntervals.delete(containerId);
    }
  }

  /**
   * Calculate resource usage percentages
   */
  processStats(stats: any): ProcessedStats {
    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                     (stats.precpu_stats.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats.system_cpu_usage - 
                        (stats.precpu_stats.system_cpu_usage || 0);
    const cpuCount = stats.cpu_stats.online_cpus || 1;
    
    let cpuPercent = 0;
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
    }

    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 0;
    const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

    // Calculate network I/O
    let networkRx = 0;
    let networkTx = 0;
    if (stats.networks) {
      Object.values(stats.networks).forEach((network: any) => {
        networkRx += network.rx_bytes || 0;
        networkTx += network.tx_bytes || 0;
      });
    }

    // Calculate block I/O
    let blockRead = 0;
    let blockWrite = 0;
    if (stats.blkio_stats?.io_service_bytes_recursive) {
      stats.blkio_stats.io_service_bytes_recursive.forEach((io: any) => {
        if (io.op === 'Read') blockRead += io.value || 0;
        if (io.op === 'Write') blockWrite += io.value || 0;
      });
    }

    // Get PIDs
    const pids = stats.pids_stats?.current || 0;

    return {
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      memoryUsage,
      memoryLimit,
      memoryPercent: Math.round(memoryPercent * 100) / 100,
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
      pids
    };
  }

  /**
   * Get current streaming containers
   */
  getStreamingContainers(): string[] {
    return Array.from(this.streamingContainers.keys());
  }

  /**
   * Stop all streaming
   */
  stopAllStreaming(): void {
    this.streamingContainers.forEach((_, containerId) => {
      this.stopStreaming(containerId);
    });
  }
}
