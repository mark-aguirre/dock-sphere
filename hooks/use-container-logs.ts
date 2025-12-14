import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';

export interface LogEntry {
  type: 'log' | 'error' | 'end';
  stream?: 'stdout' | 'stderr';
  data?: string;
  message?: string;
  timestamp: string;
  containerId: string;
}

export function useContainerLogs(containerId: string | null) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleMessage = useCallback((data: LogEntry) => {
    if (data.type === 'log') {
      setLogs(prev => [...prev, data]);
      setIsStreaming(true);
    } else if (data.type === 'error') {
      console.error('Log stream error:', data.message);
      setIsStreaming(false);
    } else if (data.type === 'end') {
      console.log('Log stream ended');
      setIsStreaming(false);
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Log SSE error:', error);
    setIsStreaming(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsStreaming(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const url = containerId ? `/api/containers/${containerId}/logs/stream` : null;

  const { isConnected, error, reconnectAttempts, disconnect, reconnect } = useSSE(
    url,
    {
      onMessage: handleMessage,
      onError: handleError,
      onOpen: handleOpen,
      onClose: handleClose,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    }
  );

  return {
    logs,
    isStreaming,
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect,
    clearLogs
  };
}