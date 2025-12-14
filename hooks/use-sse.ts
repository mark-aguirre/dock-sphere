import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSSEOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useSSE(url: string | null, options: UseSSEOptions = {}) {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (event) => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        onOpen?.(event);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error('Error parsing SSE message:', err);
          setError('Failed to parse message');
        }
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        onError?.(event);

        if (eventSource.readyState === EventSource.CLOSED) {
          setError('Connection closed');
          onClose?.(event);
          
          // Attempt reconnection if enabled
          if (reconnect && reconnectAttempts < maxReconnectAttempts) {
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }, reconnectInterval);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            setError('Max reconnection attempts reached');
          }
        }
      };

    } catch (err) {
      setError('Failed to create EventSource');
      console.error('SSE connection error:', err);
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  const reconnectManually = useCallback(() => {
    setReconnectAttempts(0);
    setError(null);
    connect();
  }, [connect]);

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    isConnected,
    error,
    reconnectAttempts,
    disconnect,
    reconnect: reconnectManually
  };
}