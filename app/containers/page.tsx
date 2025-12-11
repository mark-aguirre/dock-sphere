'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { ContainersList } from '@/components/containers/ContainersList';
import { ListSkeleton } from '@/components/ui/skeleton-loader';
import { NoContainersState } from '@/components/ui/empty-state';
import { DockerConnectionError, NetworkError } from '@/components/ui/error-state';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function ContainersPage() {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await apiClient.containers.list();
      
      // Transform API response to match Container type
      const transformedContainers = data.map((container: any) => ({
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
        cpu: 0, // Will be populated by stats API
        memory: 0, // Will be populated by stats API
        memoryLimit: 0, // Will be populated by stats API
      }));
      
      setContainers(transformedContainers);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch containers');
      toast({
        title: 'Error loading containers',
        description: error.message || 'Failed to fetch containers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map Docker state to our status type
  const mapDockerStateToStatus = (state: string): 'running' | 'stopped' | 'paused' | 'restarting' | 'created' => {
    const lowerState = state.toLowerCase();
    if (lowerState === 'running') return 'running';
    if (lowerState === 'paused') return 'paused';
    if (lowerState === 'restarting') return 'restarting';
    if (lowerState === 'created') return 'created';
    return 'stopped';
  };

  const handleStart = async (id: string) => {
    try {
      await apiClient.containers.start(id);
      toast({
        title: "Container Started",
        description: `Container ${id.slice(0, 8)} is starting...`,
      });
      fetchContainers();
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
      fetchContainers();
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
      fetchContainers();
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
      fetchContainers();
    } catch (error: any) {
      // If container is running, ask if they want to force remove
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

  const handleCreate = () => {
    toast({
      title: "Create Container",
      description: "Container creation will be implemented in the next task.",
    });
  };

  if (loading) {
    return (
      <AppLayout title="Containers" description="Manage your Docker containers">
        <ListSkeleton rows={8} columns={6} />
      </AppLayout>
    );
  }

  if (error) {
    const isDockerError = error.includes('Docker') || error.includes('daemon');
    const isNetworkError = error.includes('network') || error.includes('connection');
    
    return (
      <AppLayout title="Containers" description="Manage your Docker containers">
        {isDockerError ? (
          <DockerConnectionError onRetry={fetchContainers} />
        ) : isNetworkError ? (
          <NetworkError onRetry={fetchContainers} />
        ) : (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Containers" 
      description="Manage your Docker containers"
    >
      {containers.length === 0 ? (
        <NoContainersState 
          onCreateContainer={handleCreate}
          onBrowseTemplates={() => window.location.href = '/templates'}
        />
      ) : (
        <ContainersList
          containers={containers}
          onStart={handleStart}
          onStop={handleStop}
          onRestart={handleRestart}
          onDelete={handleDelete}
          onCreate={handleCreate}
          loading={loading}
        />
      )}
    </AppLayout>
  );
}
