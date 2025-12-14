import { NextRequest } from 'next/server';
import { docker } from '@/lib/docker';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout;
      let isActive = true;

      const sendStats = async () => {
        if (!isActive) return;

        try {
          // Get all containers
          const containers = await docker.listContainers();
          const runningContainers = containers.filter(c => c.State === 'running');

          if (runningContainers.length === 0) {
            const emptyStats = {
              totalContainers: containers.length,
              runningContainers: 0,
              totalCpuPercent: 0,
              totalMemoryUsage: 0,
              totalMemoryLimit: 0,
              totalNetworkRx: 0,
              totalNetworkTx: 0,
              timestamp: new Date().toISOString()
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(emptyStats)}\n\n`));
            return;
          }

          // Get stats for all running containers
          const statsPromises = runningContainers.map(async (containerInfo) => {
            try {
              const container = docker.getContainer(containerInfo.Id);
              const stats = await container.stats({ stream: false });
              return processStats(stats);
            } catch (error) {
              console.error(`Error getting stats for ${containerInfo.Id}:`, error);
              return null;
            }
          });

          const allStats = (await Promise.all(statsPromises)).filter(s => s !== null);

          // Aggregate the stats
          const aggregate = allStats.reduce(
            (acc, stats) => ({
              totalCpuPercent: acc.totalCpuPercent + (stats?.cpuPercent || 0),
              totalMemoryUsage: acc.totalMemoryUsage + (stats?.memoryUsage || 0),
              totalMemoryLimit: acc.totalMemoryLimit + (stats?.memoryLimit || 0),
              totalNetworkRx: acc.totalNetworkRx + (stats?.networkRx || 0),
              totalNetworkTx: acc.totalNetworkTx + (stats?.networkTx || 0)
            }),
            {
              totalCpuPercent: 0,
              totalMemoryUsage: 0,
              totalMemoryLimit: 0,
              totalNetworkRx: 0,
              totalNetworkTx: 0
            }
          );

          const result = {
            totalContainers: containers.length,
            runningContainers: runningContainers.length,
            ...aggregate,
            timestamp: new Date().toISOString()
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
        } catch (error) {
          console.error('Error streaming stats:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to get stats' })}\n\n`));
        }
      };

      // Send initial stats
      sendStats();

      // Send stats every 2 seconds for real-time updates
      intervalId = setInterval(sendStats, 2000);

      // Cleanup function
      const cleanup = () => {
        isActive = false;
        if (intervalId) {
          clearInterval(intervalId);
        }
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);

      return cleanup;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

function processStats(stats: any) {
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

  // Calculate network I/O
  let networkRx = 0;
  let networkTx = 0;
  if (stats.networks) {
    Object.values(stats.networks).forEach((network: any) => {
      networkRx += network.rx_bytes || 0;
      networkTx += network.tx_bytes || 0;
    });
  }

  return {
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memoryUsage,
    memoryLimit,
    networkRx,
    networkTx
  };
}