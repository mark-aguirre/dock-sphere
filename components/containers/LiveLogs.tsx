'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContainerLogs } from '@/hooks/use-container-logs';
import { Play, Pause, Trash2, Download, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LiveLogsProps {
  containerId: string;
  containerName: string;
  className?: string;
}

export function LiveLogs({ containerId, containerName, className }: LiveLogsProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    logs,
    isStreaming,
    isConnected,
    error,
    disconnect,
    reconnect,
    clearLogs
  } = useContainerLogs(isActive ? containerId : null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleToggleStream = () => {
    if (isActive) {
      setIsActive(false);
      disconnect();
    } else {
      setIsActive(true);
      reconnect();
    }
  };

  const handleClearLogs = () => {
    clearLogs();
    toast({
      title: "Logs cleared",
      description: "All log entries have been cleared",
    });
  };

  const handleCopyLogs = async () => {
    const logText = logs
      .filter(log => log.type === 'log')
      .map(log => `[${log.timestamp}] ${log.stream}: ${log.data}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      toast({
        title: "Logs copied",
        description: "Log entries copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy logs to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadLogs = () => {
    const logText = logs
      .filter(log => log.type === 'log')
      .map(log => `[${log.timestamp}] ${log.stream}: ${log.data}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${containerName}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Live Logs</CardTitle>
            <Badge variant="outline" className="text-xs">
              {containerName}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="text-xs"
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStream}
              className="flex items-center gap-1"
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-destructive">
            Error: {error}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-96 w-full border rounded-md"
          onScrollCapture={(e) => {
            const target = e.target as HTMLElement;
            const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
            setAutoScroll(isAtBottom);
          }}
        >
          <div className="p-4 font-mono text-sm space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                {isActive ? "Waiting for logs..." : "Click Start to begin streaming logs"}
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-2 text-xs leading-relaxed",
                    log.stream === 'stderr' && "text-red-400",
                    log.type === 'error' && "text-destructive font-medium"
                  )}
                >
                  <span className="text-muted-foreground shrink-0 w-20">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  {log.stream && (
                    <Badge 
                      variant={log.stream === 'stderr' ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1 py-0 h-4 shrink-0"
                    >
                      {log.stream}
                    </Badge>
                  )}
                  <span className="flex-1 break-all">
                    {log.data || log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>{logs.length} log entries</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-scroll
          </label>
        </div>
      </CardContent>
    </Card>
  );
}