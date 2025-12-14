import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';
import { AggregateStats } from '@/types/stats';

export function useRealtimeStats() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleMessage = useCallback((data: any) => {
    if (data.error) {
      console.error('Stats error:', data.error);
      return;
    }

    setStats(data);
    setLastUpdated(new Date());
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Stats SSE error:', error);
  }, []);

  const { isConnected, error, reconnectAttempts, disconnect, reconnect } = useSSE(
    '/api/stats/stream',
    {
      onMessage: handleMessage,
      onError: handleError,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    }
  );

  return {
    stats,
    lastUpdated,
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect
  };
}