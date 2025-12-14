'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { ContainerCard } from '@/components/containers/ContainerCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ResourceMonitor } from '@/components/dashboard/ResourceMonitor';
import { NetworkPanel } from '@/components/dashboard/NetworkPanel';
import { ContainerGrid } from '@/components/dashboard/ContainerGrid';
import { Container, Box, Network, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompactMode } from '@/contexts/CompactModeContext';
import { DashboardSkeleton } from '@/components/ui/skeleton-loader';
import { NoContainersState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { AggregateStats } from '@/types/stats';
import { useRealtimeStats } from '@/hooks/use-realtime-stats';
import { useDockerEvents } from '@/hooks/use-docker-events';
import { RealtimeStatus } from '@/components/dashboard/RealtimeStatus';
import { DockerEventsPanel } from '@/components/dashboard/DockerEventsPanel';

export default function Dashboard() {
  const { toast } = useToast();
  const { isCompact } = useCompactMode();
  const queryClient = useQueryClient();
  
  // Real-time stats via SSE
  const { stats: realtimeStats, isConnected: statsConnected } = useRealtimeStats();
  
  // Real-time Docker events
  const { lastEvent, isConnected: eventsConnected } = useDockerEvents();
  
  // Use React Query for data fetching with caching
  const { data: containersData = [], isLoading: containersLoading } = useQuery({
    queryKey: ['containers'],
    queryFn: () => apiClient.containers.list(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  const { data: imagesData = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['images'],
    queryFn: () => apiClient.images.list(false),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: networksData = [], isLoading: networksLoading } = useQuery({
    queryKey: ['networks'],
    queryFn: () => apiClient.networks.list(),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: volumesData = [], isLoading: volumesLoading } = useQuery({
    queryKey: ['volumes'],
    queryFn: () => apiClient.volumes.list(),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fallback to polling if SSE is not connected
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.stats.aggregate() as Promise<AggregateStats>,
    refetchInterval: statsConnected ? false : 5000, // Only poll if SSE is not connected
    staleTime: 2000,
    enabled: !statsConnected, // Disable polling when SSE is active
  });

  const loading = containersLoading || imagesLoading || networksLoading || volumesLoading;
  
  // Mock historical data for sparklines
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);

  // Helper function to map Docker state to status
  const mapDockerStateToStatus = (state: string): 'running' | 'stopped' | 'paused' | 'restarting' | 'created' => {
    const lowerState = state.toLowerCase();
    if (lowerState === 'running') return 'running';
    if (lowerState === 'paused') return 'paused';
    if (lowerState === 'restarting') return 'restarting';
    if (lowerState === 'created') return 'created';
    return 'stopped';
  };

  // Transform containers data with useMemo to prevent recalculation
  const containers = useMemo(() => {
    return (containersData as any[]).map((container: any) => ({
      id: container.id,
      name: container.names[0] || 'unknown',
      image: container.image,
      status: mapDockerStateToStatus(container.state),
      state: container.status,
      created: new Date(container.created * 1000).toISOString(),
      ports: container.ports.map((port: any) => ({
        containerPort: port.PrivatePort || 0,
        hostPort: port.PublicPort || 0,
        protocol: port.Type || 'tcp',
      })),
      networks: Object.keys(container.networkSettings?.Networks || {}),
      volumes: container.mounts?.map((mount: any) => ({
        source: mount.Source || mount.Name || '',
        destination: mount.Destination || '',
        mode: mount.RW ? 'rw' : 'ro',
      })) || [],
      cpu: 0, // Individual container stats would need separate API calls
      memory: 0, // Individual container stats would need separate API calls
      memoryLimit: 1024,
    }));
  }, [containersData]);

  const images = imagesData as any[];
  const networks = networksData as any[];
  const volumes = volumesData as any[];

  const runningContainers = containers.filter(c => c.status === 'running');
  const stoppedContainers = containers.filter(c => c.status === 'stopped');
  
  // Use real-time stats if available, otherwise fallback to polling
  const currentStats = realtimeStats || statsData;
  const totalCpu = currentStats?.totalCpuPercent || 0;
  const totalMemory = currentStats?.totalMemoryUsage ? Math.round(currentStats.totalMemoryUsage / (1024 * 1024)) : 0; // Convert bytes to MB
  const totalMemoryLimit = currentStats?.totalMemoryLimit || 0; // Keep in bytes for ResourceMonitor
  
  // Calculate network I/O rates (convert bytes to MB/s - this is instantaneous, not per second)
  const networkRxMB = currentStats?.totalNetworkRx ? currentStats.totalNetworkRx / (1024 * 1024) : 0;
  const networkTxMB = currentStats?.totalNetworkTx ? currentStats.totalNetworkTx / (1024 * 1024) : 0;
  
  // For "total today" we'll use the sum of rx + tx in MB (more appropriate for current usage)
  const totalNetworkMB = networkRxMB + networkTxMB;

  useEffect(() => {
    // Generate mock historical data (deterministic for SSR)
    const generateHistory = (current: number, points: number = 20) => {
      return Array.from({ length: points }, (_, i) => {
        // Use deterministic values based on index to avoid hydration mismatch
        const variance = Math.sin(i * 0.5) * 10;
        return Math.max(0, Math.min(100, current + variance));
      });
    };

    const memoryLimitMB = totalMemoryLimit ? Math.round(totalMemoryLimit / (1024 * 1024)) : 4096;
    setCpuHistory(generateHistory(totalCpu));
    setMemoryHistory(generateHistory((totalMemory / memoryLimitMB) * 100));
  }, [totalCpu, totalMemory, totalMemoryLimit]);

  // Handle Docker events for real-time updates
  useEffect(() => {
    if (lastEvent) {
      // Invalidate queries when containers change
      if (lastEvent.eventType === 'container' && 
          ['start', 'stop', 'create', 'destroy', 'restart'].includes(lastEvent.action)) {
        queryClient.invalidateQueries({ queryKey: ['containers'] });
        
        // Show toast notification
        const containerName = lastEvent.actor.attributes.name || lastEvent.actor.id;
        toast({
          title: `Container ${lastEvent.action}`,
          description: `${containerName} has been ${lastEvent.action}ed`,
          duration: 3000,
        });
      }
      
      // Invalidate other queries based on event type
      if (lastEvent.eventType === 'image') {
        queryClient.invalidateQueries({ queryKey: ['images'] });
      } else if (lastEvent.eventType === 'network') {
        queryClient.invalidateQueries({ queryKey: ['networks'] });
      } else if (lastEvent.eventType === 'volume') {
        queryClient.invalidateQueries({ queryKey: ['volumes'] });
      }
    }
  }, [lastEvent, queryClient, toast]);

  const handleStart = async (id: string) => {
    try {
      await apiClient.containers.start(id);
      toast({
        title: "Container Started",
        description: `Container ${id.slice(0, 8)} is starting...`,
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    } catch (error: any) {
      toast({
        title: "Error starting container",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStop = async (id: string) => {
    try {
      await apiClient.containers.stop(id);
      toast({
        title: "Container Stopped",
        description: `Container ${id.slice(0, 8)} has been stopped.`,
      });
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    } catch (error: any) {
      toast({
        title: "Error stopping container",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await apiClient.containers.restart(id);
      toast({
        title: "Container Restarting",
        description: `Container ${id.slice(0, 8)} is restarting...`,
      });
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    } catch (error: any) {
      toast({
        title: "Error restarting container",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, force: boolean = false) => {
    try {
      await apiClient.containers.remove(id, force);
      toast({
        title: "Container Deleted",
        description: `Container ${id.slice(0, 8)} has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    } catch (error: any) {
      if (error.message.includes('running') || error.message.includes('stop')) {
        const shouldForce = confirm('Container is running. Force remove?');
        if (shouldForce) {
          handleDelete(id, true);
        }
      } else {
        toast({
          title: "Error deleting container",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <AppLayout title="Dashboard" description="Overview of your Docker environment">
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Dashboard" 
      description="Overview of your Docker environment"
      headerActions={
        <RealtimeStatus 
          statsConnected={statsConnected} 
          eventsConnected={eventsConnected} 
        />
      }
    >
      {/* Stats Grid with Bento Layout */}
      <StatsGrid layout="default" className={cn(isCompact ? "mb-4 lg:mb-6" : "mb-6 lg:mb-8")}>
        <div className="animate-float">
          <StatCard
            title="Running Containers"
            value={runningContainers.length}
            subtitle={`${stoppedContainers.length} stopped`}
            icon={Container}
            variant="success"
            glassmorphism={false}
          />
        </div>
        <div className="animate-float">
          <StatCard
            title="Images"
            value={images.length}
            subtitle={`${images.length} total`}
            icon={Box}
            variant="primary"
            glassmorphism={false}
          />
        </div>
        <div className="animate-float">
          <StatCard
            title="Networks"
            value={networks.length}
            subtitle="Active networks"
            icon={Network}
            variant="default"
            glassmorphism={false}
          />
        </div>
        <div className="animate-float">
          <StatCard
            title="Volumes"
            value={volumes.length}
            subtitle={`${volumes.length} total`}
            icon={HardDrive}
            variant="default"
            glassmorphism={false}
          />
        </div>
      </StatsGrid>

      {/* Resource Usage with Sparklines */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-3", isCompact ? "gap-2 lg:gap-3 mb-4 lg:mb-6" : "gap-3 lg:gap-4 mb-6 lg:mb-8")}>
        <div className="lg:col-span-2 animate-float">
          <ResourceMonitor
            cpuUsage={totalCpu}
            memoryUsage={totalMemory}
            memoryLimit={totalMemoryLimit}
            cpuHistory={cpuHistory}
            memoryHistory={memoryHistory}
            containerCount={runningContainers.length}
          />
        </div>

        <div className="animate-float">
          <NetworkPanel
            inbound={networkRxMB}
            outbound={networkTxMB}
            totalToday={totalNetworkMB}
          />
        </div>
      </div>

      {/* Docker Events Panel */}
      <div className={cn("mb-6 lg:mb-8", isCompact && "mb-4 lg:mb-6")}>
        <DockerEventsPanel />
      </div>

      {/* Recent Containers with Staggered Animation */}
      <div className={cn(isCompact ? "space-y-2 lg:space-y-3" : "space-y-3 lg:space-y-4")}>
        <div className="flex items-center justify-between">
          <h2 className={cn("font-semibold flex items-center gap-2", isCompact ? "text-sm lg:text-base" : "text-base lg:text-lg")}>
            <div className={cn("rounded-lg bg-primary/10", isCompact ? "p-1.5" : "p-2")}>
              <Container className={cn("text-primary", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            Recent Containers
          </h2>
          <span className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
            {containers.length} total
          </span>
        </div>
        
        {containers.length === 0 ? (
          <NoContainersState 
            onBrowseTemplates={() => window.location.href = '/templates'}
          />
        ) : (
          <ContainerGrid layout="grid">
            {containers.slice(0, 6).map((container, index) => (
              <div
                key={container.id}
                className={cn(
                  'animate-in fade-in slide-in-from-bottom-4 animate-float',
                  `stagger-${Math.min(index + 1, 6)}`
                )}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <ContainerCard
                  container={container}
                  onStart={handleStart}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </ContainerGrid>
        )}
      </div>
    </AppLayout>
  );
}
