import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';

export interface PullProgress {
  type: 'pull-start' | 'pull-progress' | 'pull-complete' | 'pull-error';
  image: string;
  id?: string;
  status?: string;
  progress?: string;
  progressDetail?: {
    current?: number;
    total?: number;
  };
  message?: string;
  timestamp: string;
}

export function useImagePull() {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState<PullProgress[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleMessage = useCallback((data: PullProgress) => {
    setProgress(prev => [...prev, data]);
    
    if (data.type === 'pull-complete' || data.type === 'pull-error') {
      setIsActive(false);
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Image pull SSE error:', error);
    setIsActive(false);
  }, []);

  const url = isActive && currentImage ? '/api/images/pull/stream' : null;

  const { isConnected, error, disconnect } = useSSE(
    url,
    {
      onMessage: handleMessage,
      onError: handleError,
      reconnect: false // Don't auto-reconnect for pull operations
    }
  );

  const startPull = useCallback(async (imageName: string) => {
    if (isActive) return;

    setCurrentImage(imageName);
    setProgress([]);
    setIsActive(true);

    try {
      // Start the pull by making a POST request to the streaming endpoint
      const response = await fetch('/api/images/pull/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start pull: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to start image pull:', error);
      setIsActive(false);
    }
  }, [isActive]);

  const stopPull = useCallback(() => {
    setIsActive(false);
    setCurrentImage(null);
    disconnect();
  }, [disconnect]);

  const clearProgress = useCallback(() => {
    setProgress([]);
  }, []);

  const getOverallProgress = useCallback(() => {
    if (progress.length === 0) return 0;

    const progressEntries = progress.filter(p => 
      p.type === 'pull-progress' && 
      p.progressDetail?.current && 
      p.progressDetail?.total
    );

    if (progressEntries.length === 0) return 0;

    const totalBytes = progressEntries.reduce((sum, p) => sum + (p.progressDetail?.total || 0), 0);
    const currentBytes = progressEntries.reduce((sum, p) => sum + (p.progressDetail?.current || 0), 0);

    return totalBytes > 0 ? Math.round((currentBytes / totalBytes) * 100) : 0;
  }, [progress]);

  return {
    isActive,
    progress,
    currentImage,
    isConnected,
    error,
    startPull,
    stopPull,
    clearProgress,
    overallProgress: getOverallProgress()
  };
}