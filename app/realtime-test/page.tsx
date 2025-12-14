'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealtimeStats } from '@/hooks/use-realtime-stats';
import { useDockerEvents } from '@/hooks/use-docker-events';
import { useContainerLogs } from '@/hooks/use-container-logs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RealtimeTestPage() {
  const [testContainerId, setTestContainerId] = useState('');
  
  const { 
    stats, 
    isConnected: statsConnected, 
    error: statsError 
  } = useRealtimeStats();
  
  const { 
    events, 
    lastEvent, 
    isConnected: eventsConnected, 
    error: eventsError 
  } = useDockerEvents();
  
  const { 
    logs, 
    isConnected: logsConnected, 
    error: logsError 
  } = useContainerLogs(testContainerId || null);

  return (
    <AppLayout title="Real-time Features Test" description="Test SSE endpoints and real-time functionality">
      <div className="space-y-6">
        {/* Stats Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Real-time Stats
              <Badge variant={statsConnected ? "default" : "destructive"}>
                {statsConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsError && (
              <div className="text-destructive mb-4">Error: {statsError}</div>
            )}
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Containers</div>
                  <div>{stats.totalContainers}</div>
                </div>
                <div>
                  <div className="font-medium">Running</div>
                  <div>{stats.runningContainers}</div>
                </div>
                <div>
                  <div className="font-medium">CPU %</div>
                  <div>{stats.totalCpuPercent.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="font-medium">Memory</div>
                  <div>{Math.round(stats.totalMemoryUsage / (1024 * 1024))} MB</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Waiting for stats data...</div>
            )}
          </CardContent>
        </Card>

        {/* Events Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Docker Events
              <Badge variant={eventsConnected ? "default" : "destructive"}>
                {eventsConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsError && (
              <div className="text-destructive mb-4">Error: {eventsError}</div>
            )}
            
            {lastEvent && (
              <div className="mb-4 p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">Latest Event:</div>
                <div className="text-sm">
                  {lastEvent.eventType} - {lastEvent.action} - {lastEvent.actor.attributes.name || lastEvent.actor.id}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(lastEvent.time).toLocaleString()}
                </div>
              </div>
            )}
            
            <div className="text-sm">
              <div className="font-medium mb-2">Recent Events ({events.length}):</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {events.slice(0, 10).map((event, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {event.eventType}
                    </Badge>
                    <span>{event.action}</span>
                    <span className="text-muted-foreground">
                      {event.actor.attributes.name || event.actor.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Container Logs
              <Badge variant={logsConnected ? "default" : "destructive"}>
                {logsConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="containerId">Container ID</Label>
              <Input
                id="containerId"
                placeholder="Enter container ID to stream logs"
                value={testContainerId}
                onChange={(e) => setTestContainerId(e.target.value)}
              />
            </div>
            
            {logsError && (
              <div className="text-destructive mb-4">Error: {logsError}</div>
            )}
            
            <div className="text-sm">
              <div className="font-medium mb-2">Log Entries ({logs.length}):</div>
              <div className="space-y-1 max-h-40 overflow-y-auto font-mono text-xs bg-muted/30 p-2 rounded">
                {logs.slice(-20).map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.stream && (
                      <Badge variant={log.stream === 'stderr' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {log.stream}
                      </Badge>
                    )}
                    <span>{log.data || log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-muted-foreground">
                    {testContainerId ? "Waiting for logs..." : "Enter a container ID to start streaming"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">Stats SSE</div>
                <Badge variant={statsConnected ? "default" : "destructive"}>
                  {statsConnected ? "✓ Active" : "✗ Inactive"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium">Events SSE</div>
                <Badge variant={eventsConnected ? "default" : "destructive"}>
                  {eventsConnected ? "✓ Active" : "✗ Inactive"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium">Logs SSE</div>
                <Badge variant={logsConnected ? "default" : "destructive"}>
                  {logsConnected ? "✓ Active" : "✗ Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}