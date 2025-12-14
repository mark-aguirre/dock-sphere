import { NextRequest } from 'next/server';
import { docker } from '@/lib/docker';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let intervalId: NodeJS.Timeout;
      
      const sendContainers = async () => {
        try {
          // Get all containers (including stopped ones)
          const containers = await docker.listContainers({ all: true });
          
          // Transform to match our Container type
          const transformedContainers = containers.map((container: any) => ({
            id: container.Id,
            name: container.Names[0]?.replace('/', '') || 'unknown',
            image: container.Image,
            status: mapDockerStateToStatus(container.State),
            state: container.Status,
            created: new Date(container.Created * 1000).toISOString(),
            ports: container.Ports?.map((port: any) => ({
              containerPort: port.PrivatePort || 0,
              hostPort: port.PublicPort || 0,
              protocol: port.Type || 'tcp',
            })) || [],
            networks: Object.keys(container.NetworkSettings?.Networks || {}),
            volumes: container.Mounts?.map((mount: any) => ({
              source: mount.Source || mount.Name || '',
              destination: mount.Destination || '',
              mode: mount.RW ? 'rw' : 'ro',
            })) || [],
            cpu: 0,
            memory: 0,
            memoryLimit: 0,
          }));
          
          const data = `data: ${JSON.stringify({
            type: 'containers',
            containers: transformedContainers,
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(data));
        } catch (error: any) {
          const errorData = `data: ${JSON.stringify({ 
            type: 'error',
            error: error.message || 'Failed to get containers',
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };

      // Helper function to map Docker state to our status type
      const mapDockerStateToStatus = (state: string): 'running' | 'stopped' | 'paused' | 'restarting' | 'created' => {
        const lowerState = state.toLowerCase();
        if (lowerState === 'running') return 'running';
        if (lowerState === 'paused') return 'paused';
        if (lowerState === 'restarting') return 'restarting';
        if (lowerState === 'created') return 'created';
        return 'stopped';
      };

      // Send initial containers
      await sendContainers();
      
      // Set up interval to send containers every 3 seconds
      intervalId = setInterval(sendContainers, 3000);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}