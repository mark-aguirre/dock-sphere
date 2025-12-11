'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { NoBuildsState, SearchEmptyState } from '@/components/ui/empty-state';
import { DockerConnectionError, NetworkError } from '@/components/ui/error-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, GitBranch, Github, Gitlab, Plus, Trash2, Play, Settings, RefreshCw, MoreVertical, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { ConnectRepositoryDialog } from '@/components/builds/ConnectRepositoryDialog';
import { BuildDialog } from '@/components/builds/BuildDialog';
import { BuildOutputDialog } from '@/components/builds/BuildOutputDialog';
import { RepositorySettingsDialog } from '@/components/builds/RepositorySettingsDialog';

export default function BuildsPage() {
  const [search, setSearch] = useState('');
  const [repositories, setRepositories] = useState<any[]>([]);
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [buildDialogOpen, setBuildDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [buildOutputOpen, setBuildOutputOpen] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<any>(null);
  const [deletingRepos, setDeletingRepos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reposData, buildsData] = await Promise.all([
        apiClient.builds.listRepositories(),
        apiClient.builds.listBuilds()
      ]);
      setRepositories((reposData as any).repositories || []);
      setBuilds((buildsData as any).builds || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch repositories and builds');
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to fetch repositories and builds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = (repo: any) => {
    setSelectedRepo(repo);
    setBuildDialogOpen(true);
  };

  const handleSettings = (repo: any) => {
    setSelectedRepo(repo);
    setSettingsDialogOpen(true);
  };

  const handleViewBuild = (build: any) => {
    setSelectedBuild(build);
    setBuildOutputOpen(true);
  };

  const handleDeleteRepo = async (repoId: string) => {
    try {
      setDeletingRepos(prev => new Set(prev).add(repoId));
      await apiClient.builds.deleteRepository(repoId);
      toast({
        title: 'Repository Removed',
        description: 'Repository has been disconnected',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingRepos(prev => {
        const newSet = new Set(prev);
        newSet.delete(repoId);
        return newSet;
      });
    }
  };

  const filteredRepositories = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBuilds = builds.filter((build) =>
    build.repository.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout title="Builds" description="Build Docker images from Git repositories">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    const isDockerError = error.includes('Docker') || error.includes('daemon');
    const isNetworkError = error.includes('network') || error.includes('connection');
    
    return (
      <AppLayout title="Builds" description="Build Docker images from Git repositories">
        {isDockerError ? (
          <DockerConnectionError onRetry={fetchData} />
        ) : isNetworkError ? (
          <NetworkError onRetry={fetchData} />
        ) : (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Builds" description="Build Docker images from Git repositories">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setConnectDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Connect Repository
          </Button>
        </div>

        <Tabs defaultValue="repositories" className="w-full">
          <TabsList>
            <TabsTrigger value="repositories">Repositories</TabsTrigger>
            <TabsTrigger value="builds">Build History</TabsTrigger>
          </TabsList>

          <TabsContent value="repositories" className="space-y-4 mt-4">
            {repositories.length === 0 ? (
              search ? (
                <SearchEmptyState 
                  query={search} 
                  onClearSearch={() => setSearch('')} 
                />
              ) : (
                <NoBuildsState onConnectRepository={() => setConnectDialogOpen(true)} />
              )
            ) : filteredRepositories.length === 0 ? (
              <SearchEmptyState 
                query={search} 
                onClearSearch={() => setSearch('')} 
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRepositories.map((repo) => (
                  <Card key={repo.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {repo.provider === 'github' ? (
                            <Github className="w-4 h-4" />
                          ) : (
                            <Gitlab className="w-4 h-4" />
                          )}
                          <CardTitle className="text-sm">{repo.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1"
                          onClick={() => {
                            const url = repo.provider === 'github'
                              ? `https://github.com/${repo.fullName}`
                              : `https://gitlab.com/${repo.fullName}`;
                            window.open(url, '_blank');
                          }}
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs">{repo.fullName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GitBranch className="w-3 h-3" />
                        <span>{repo.defaultBranch}</span>
                      </div>
                      {repo.dockerfilePath && (
                        <div className="text-xs text-muted-foreground">
                          Dockerfile: {repo.dockerfilePath}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 border-t border-border pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 transition-all hover:bg-muted h-7 text-xs"
                          onClick={() => handleBuild(repo)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Build
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 transition-all hover:bg-muted"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              className="cursor-pointer text-xs"
                              onClick={() => handleSettings(repo)}
                            >
                              <Settings className="w-3.5 h-3.5 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer text-xs"
                              onClick={() => handleDeleteRepo(repo.id)}
                              disabled={deletingRepos.has(repo.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              {deletingRepos.has(repo.id) ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="builds" className="space-y-4 mt-4">
            {builds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No builds yet. Connect a repository and start building!</p>
              </div>
            ) : filteredBuilds.length === 0 ? (
              <SearchEmptyState 
                query={search} 
                onClearSearch={() => setSearch('')} 
              />
            ) : (
              <div className="space-y-2">
                {filteredBuilds.map((build) => (
                  <Card key={build.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{build.repository}</span>
                            <Badge variant="outline" className="text-xs">
                              {build.branch}
                            </Badge>
                            <Badge
                              variant={
                                build.status === 'success'
                                  ? 'default'
                                  : build.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {build.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {build.imageName} • {new Date(build.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBuild(build)}
                        >
                          View Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ConnectRepositoryDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onSuccess={fetchData}
      />

      {selectedRepo && (
        <BuildDialog
          open={buildDialogOpen}
          onOpenChange={setBuildDialogOpen}
          repository={selectedRepo}
          onSuccess={fetchData}
          onOpenSettings={() => {
            setBuildDialogOpen(false);
            setSettingsDialogOpen(true);
          }}
        />
      )}

      {selectedRepo && (
        <RepositorySettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          repository={selectedRepo}
          onSuccess={fetchData}
        />
      )}

      {selectedBuild && (
        <BuildOutputDialog
          open={buildOutputOpen}
          onOpenChange={setBuildOutputOpen}
          build={selectedBuild}
        />
      )}
    </AppLayout>
  );
}
