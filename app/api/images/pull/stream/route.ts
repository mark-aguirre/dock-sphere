import { NextRequest } from 'next/server';
import { docker } from '@/lib/docker';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { imageName } = await request.json();

  if (!imageName) {
    return new Response('Image name is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let pullStream: any;
      let isActive = true;

      const startPull = async () => {
        try {
          // Start pulling the image
          pullStream = await docker.pull(imageName);

          // Send initial status
          const startEvent = {
            type: 'pull-start',
            image: imageName,
            message: `Starting pull for ${imageName}`,
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`));

          pullStream.on('data', (chunk: Buffer) => {
            if (!isActive) return;

            try {
              const progressData = JSON.parse(chunk.toString());
              
              // Format progress data
              const progressEvent = {
                type: 'pull-progress',
                image: imageName,
                id: progressData.id || '',
                status: progressData.status || '',
                progress: progressData.progress || '',
                progressDetail: progressData.progressDetail || {},
                timestamp: new Date().toISOString()
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressEvent)}\n\n`));
            } catch (error) {
              console.error('Error parsing pull progress:', error);
            }
          });

          pullStream.on('error', (error: Error) => {
            console.error('Pull stream error:', error);
            const errorEvent = {
              type: 'pull-error',
              image: imageName,
              message: error.message,
              timestamp: new Date().toISOString()
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          });

          pullStream.on('end', () => {
            const endEvent = {
              type: 'pull-complete',
              image: imageName,
              message: `Successfully pulled ${imageName}`,
              timestamp: new Date().toISOString()
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(endEvent)}\n\n`));
          });

        } catch (error: any) {
          const errorEvent = {
            type: 'pull-error',
            image: imageName,
            message: error.message || 'Failed to start image pull',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        }
      };

      // Start the pull
      startPull();

      // Cleanup function
      const cleanup = () => {
        isActive = false;
        if (pullStream) {
          try {
            pullStream.destroy();
          } catch (error) {
            console.error('Error destroying pull stream:', error);
          }
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