'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { NoNetworksState, SearchEmptyState } from '@/components/ui/empty-state';
import { DockerConnectionError, NetworkError } from '@/components/ui/error-state';
import { Search, Plus, Trash2, Network, Link2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function NetworksPage() {
  const [search, setSearch] = useState('');
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingNetworks, setDeletingNetworks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch networks from API
  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await apiClient.networks.list();
      setNetworks(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch networks');
      toast({
        title: 'Error loading networks',
        description: error.message || 'Failed to fetch networks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredNetworks = networks.filter((network) =>
    network.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    toast({
      title: "Create Network",
      description: "Network creation dialog would open here.",
    });
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      setDeletingNetworks(prev => new Set(prev).add(id));
      await apiClient.networks.delete(id);
      toast({
        title: "Network Deleted",
        description: `Network ${name} has been removed.`,
      });
      fetchNetworks();
    } catch (error: any) {
      toast({
        title: "Error deleting network",
        description: error.message || 'Failed to delete network',
        variant: "destructive",
      });
    } finally {
      setDeletingNetworks(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <AppLayout title="Networks" description="Manage Docker networks">
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
      <AppLayout title="Networks" description="Manage Docker networks">
        {isDockerError ? (
          <DockerConnectionError onRetry={fetchNetworks} />
        ) : isNetworkError ? (
          <NetworkError onRetry={fetchNetworks} />
        ) : (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Networks" description="Manage Docker networks">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search networks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Network
          </Button>
        </div>

        {networks.length === 0 ? (
          search ? (
            <SearchEmptyState 
              query={search} 
              onClearSearch={() => setSearch('')} 
            />
          ) : (
            <NoNetworksState onCreateNetwork={handleCreate} />
          )
        ) : filteredNetworks.length === 0 ? (
          <SearchEmptyState 
            query={search} 
            onClearSearch={() => setSearch('')} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNetworks.map((network) => (
              <Card key={network.id} className="group hover:border-primary/30 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <Network className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{network.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {network.id.substring(0, 12)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{network.driver}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Scope</span>
                      <span className="font-medium capitalize text-[11px]">{network.scope}</span>
                    </div>
                    
                    {network.ipam?.config?.[0]?.subnet && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subnet</span>
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {network.ipam.config[0].subnet}
                        </span>
                      </div>
                    )}

                    {network.ipam?.config?.[0]?.gateway && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gateway</span>
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {network.ipam.config[0].gateway}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Containers</span>
                      <Badge variant="secondary" className="gap-1 text-[10px] h-5">
                        <Link2 className="w-2.5 h-2.5" />
                        {network.containers?.length || 0}
                      </Badge>
                    </div>
                  </div>

                  {network.containers && network.containers.length > 0 && (
                    <div className="pt-1.5 border-t border-border">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Connected:</p>
                      <div className="flex flex-wrap gap-1">
                        {network.containers.slice(0, 3).map((container: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                            {container.containerName}
                          </Badge>
                        ))}
                        {network.containers.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            +{network.containers.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5 pt-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                      <Link2 className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => handleDelete(network.id, network.name)}
                      disabled={(network.containers?.length || 0) > 0}
                      loading={deletingNetworks.has(network.id)}
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
