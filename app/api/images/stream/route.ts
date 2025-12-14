import { NextRequest } from 'next/server';
import { docker } from '@/lib/docker';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let intervalId: NodeJS.Timeout;
      
      const sendImages = async () => {
        try {
          // Get all images
          const images = await docker.listImages({ all: false });
          
          // Transform to match our expected format
          const transformedImages = images.map((image: any) => ({
            id: image.Id,
            repoTags: image.RepoTags || ['<none>:<none>'],
            size: image.Size || 0,
            created: image.Created || 0,
            containers: 0, // Will be populated by checking container usage
          }));

          // Get containers to check image usage
          try {
            const containers = await docker.listContainers({ all: true });
            const imageUsage = new Map<string, number>();
            
            containers.forEach((container: any) => {
              const imageId = container.ImageID || container.Image;
              if (imageId) {
                imageUsage.set(imageId, (imageUsage.get(imageId) || 0) + 1);
              }
            });

            // Update container counts
            transformedImages.forEach((image: any) => {
              image.containers = imageUsage.get(image.id) || 0;
            });
          } catch (error) {
            console.warn('Failed to get container usage for images:', error);
          }
          
          const data = `data: ${JSON.stringify({
            type: 'images',
            images: transformedImages,
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(data));
        } catch (error: any) {
          const errorData = `data: ${JSON.stringify({ 
            type: 'error',
            error: error.message || 'Failed to get images',
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };

      // Send initial images
      await sendImages();
      
      // Set up interval to send images every 5 seconds (less frequent than containers)
      intervalId = setInterval(sendImages, 5000);
      
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