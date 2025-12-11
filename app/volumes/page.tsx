'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { NoVolumesState, SearchEmptyState } from '@/components/ui/empty-state';
import { DockerConnectionError, NetworkError } from '@/components/ui/error-state';
import { Search, Plus, Trash2, HardDrive, FolderOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function VolumesPage() {
  const [search, setSearch] = useState('');
  const [volumes, setVolumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingVolumes, setDeletingVolumes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch volumes from API
  useEffect(() => {
    fetchVolumes();
  }, []);

  const fetchVolumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await apiClient.volumes.list();
      setVolumes(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch volumes');
      toast({
        title: 'Error loading volumes',
        description: error.message || 'Failed to fetch volumes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVolumes = volumes.filter((volume) =>
    volume.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    toast({
      title: "Create Volume",
      description: "Volume creation dialog would open here.",
    });
  };

  const handleDelete = async (name: string) => {
    try {
      setDeletingVolumes(prev => new Set(prev).add(name));
      await apiClient.volumes.delete(name);
      toast({
        title: "Volume Deleted",
        description: `Volume ${name} has been removed.`,
      });
      fetchVolumes();
    } catch (error: any) {
      toast({
        title: "Error deleting volume",
        description: error.message || 'Failed to delete volume',
        variant: "destructive",
      });
    } finally {
      setDeletingVolumes(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <AppLayout title="Volumes" description="Manage Docker volumes">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (error) {
    const isDockerError = error.includes('Docker') || error.includes('daemon');
    const isNetworkError = error.includes('network') || error.includes('connection');
    
    return (
      <AppLayout title="Volumes" description="Manage Docker volumes">
        {isDockerError ? (
          <DockerConnectionError onRetry={fetchVolumes} />
        ) : isNetworkError ? (
          <NetworkError onRetry={fetchVolumes} />
        ) : (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Volumes" description="Manage Docker volumes">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search volumes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Volume
          </Button>
        </div>

        {volumes.length === 0 ? (
          search ? (
            <SearchEmptyState 
              query={search} 
              onClearSearch={() => setSearch('')} 
            />
          ) : (
            <NoVolumesState onCreateVolume={handleCreate} />
          )
        ) : filteredVolumes.length === 0 ? (
          <SearchEmptyState 
            query={search} 
            onClearSearch={() => setSearch('')} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolumes.map((volume) => (
            <Card key={volume.name} className="group hover:border-primary/30 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <HardDrive className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm truncate" title={volume.name}>{volume.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">{volume.driver}</p>
                    </div>
                  </div>
                  {volume.usedBy && volume.usedBy.length > 0 ? (
                    <Badge className="bg-status-running/10 text-status-running border-0 text-xs h-5 flex-shrink-0">
                      In Use
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs h-5 flex-shrink-0">Unused</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-1.5 text-xs">
                  {volume.size && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono font-medium text-[11px]">{formatBytes(volume.size)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-[11px]">{new Date(volume.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-muted-foreground text-[10px]">Mount Point</span>
                    <p className="font-mono text-[10px] bg-muted px-1.5 py-1 rounded mt-0.5 break-all">
                      {volume.mountpoint}
                    </p>
                  </div>
                </div>

                {volume.usedBy && volume.usedBy.length > 0 && (
                  <div className="pt-1.5 border-t border-border">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Used by:</p>
                    <div className="flex flex-wrap gap-1">
                      {volume.usedBy.map((container: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                          {container}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-1.5 pt-1.5">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    Browse
                  </Button>
                  <LoadingButton
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    onClick={() => handleDelete(volume.name)}
                    disabled={volume.usedBy && volume.usedBy.length > 0}
                    loading={deletingVolumes.has(volume.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
