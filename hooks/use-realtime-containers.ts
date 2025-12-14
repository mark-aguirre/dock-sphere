import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';
import { Container } from '@/types/docker';

export function useRealtimeContainers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleMessage = useCallback((data: any) => {
    if (data.error) {
      console.error('Containers error:', data.error);
      return;
    }

    if (data.type === 'containers' && Array.isArray(data.containers)) {
      setContainers(data.containers);
      setLastUpdated(new Date());
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Containers SSE error:', error);
  }, []);

  const { isConnected, error, reconnectAttempts, disconnect, reconnect } = useSSE(
    '/api/containers/stream',
    {
      onMessage: handleMessage,
      onError: handleError,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    }
  );

  return {
    containers,
    lastUpdated,
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect
  };
}