import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';

export interface DockerEvent {
  type: string;
  action: string;
  eventType: string;
  actor: {
    id: string;
    attributes: Record<string, string>;
  };
  time: string;
  timeNano: number;
  scope: string;
}

export function useDockerEvents() {
  const [events, setEvents] = useState<DockerEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<DockerEvent | null>(null);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'docker-event') {
      const event = data as DockerEvent;
      setLastEvent(event);
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
    } else if (data.type === 'error') {
      console.error('Docker events error:', data.message);
    } else if (data.type === 'connected') {
      console.log('Docker events connected');
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Docker events SSE error:', error);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  const { isConnected, error, reconnectAttempts, disconnect, reconnect } = useSSE(
    '/api/docker/events/stream',
    {
      onMessage: handleMessage,
      onError: handleError,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    }
  );

  return {
    events,
    lastEvent,
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect,
    clearEvents
  };
}