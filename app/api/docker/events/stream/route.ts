import { NextRequest } from 'next/server';
import { docker } from '@/lib/docker';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let eventStream: any;
      let isActive = true;

      const startEventStream = async () => {
        try {
          // Start streaming Docker events
          eventStream = await docker.getEvents({
            filters: {
              type: ['container', 'image', 'network', 'volume']
            }
          });

          eventStream.on('data', (chunk: Buffer) => {
            if (!isActive) return;

            try {
              const eventData = JSON.parse(chunk.toString());
              
              // Format the event for the frontend
              const formattedEvent = {
                type: 'docker-event',
                action: eventData.Action,
                eventType: eventData.Type,
                actor: {
                  id: eventData.Actor?.ID?.substring(0, 12) || 'unknown',
                  attributes: eventData.Actor?.Attributes || {}
                },
                time: new Date(eventData.time * 1000).toISOString(),
                timeNano: eventData.timeNano,
                scope: eventData.scope || 'local'
              };

              // Add specific details based on event type
              if (eventData.Type === 'container') {
                formattedEvent.actor.attributes.name = eventData.Actor?.Attributes?.name || 'unknown';
                formattedEvent.actor.attributes.image = eventData.Actor?.Attributes?.image || 'unknown';
              } else if (eventData.Type === 'image') {
                formattedEvent.actor.attributes.name = eventData.Actor?.Attributes?.name || 'unknown';
              } else if (eventData.Type === 'network') {
                formattedEvent.actor.attributes.name = eventData.Actor?.Attributes?.name || 'unknown';
                formattedEvent.actor.attributes.type = eventData.Actor?.Attributes?.type || 'unknown';
              } else if (eventData.Type === 'volume') {
                formattedEvent.actor.attributes.driver = eventData.Actor?.Attributes?.driver || 'local';
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(formattedEvent)}\n\n`));
            } catch (error) {
              console.error('Error processing Docker event:', error);
            }
          });

          eventStream.on('error', (error: Error) => {
            console.error('Docker event stream error:', error);
            const errorEvent = {
              type: 'error',
              message: error.message,
              timestamp: new Date().toISOString()
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          });

          eventStream.on('end', () => {
            const endEvent = {
              type: 'end',
              message: 'Docker event stream ended',
              timestamp: new Date().toISOString()
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(endEvent)}\n\n`));
          });

          // Send initial connection confirmation
          const connectEvent = {
            type: 'connected',
            message: 'Docker event stream connected',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`));

        } catch (error: any) {
          const errorEvent = {
            type: 'error',
            message: error.message || 'Failed to start Docker event stream',
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        }
      };

      // Start the event stream
      startEventStream();

      // Cleanup function
      const cleanup = () => {
        isActive = false;
        if (eventStream) {
          try {
            eventStream.destroy();
          } catch (error) {
            console.error('Error destroying event stream:', error);
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