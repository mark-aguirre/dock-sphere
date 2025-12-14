import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';
import { DockerImage } from '@/types/docker';

export function useRealtimeImages() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleMessage = useCallback((data: any) => {
    if (data.error) {
      console.error('Images error:', data.error);
      return;
    }

    if (data.type === 'images' && Array.isArray(data.images)) {
      setImages(data.images);
      setLastUpdated(new Date());
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Images SSE error:', error);
  }, []);

  const { isConnected, error, reconnectAttempts, disconnect, reconnect } = useSSE(
    '/api/images/stream',
    {
      onMessage: handleMessage,
      onError: handleError,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    }
  );

  return {
    images,
    lastUpdated,
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect
  };
}