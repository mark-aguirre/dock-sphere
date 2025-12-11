'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Gitlab } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface ConnectRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConnectRepositoryDialog({ open, onOpenChange, onSuccess }: ConnectRepositoryDialogProps) {
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [dockerfilePath, setDockerfilePath] = useState('Dockerfile');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      checkAuthentication();
    }
  }, [open, provider]);

  const checkAuthentication = async () => {
    try {
      const result = await apiClient.builds.checkAuth(provider) as { authenticated: boolean };
      setIsAuthenticated(result.authenticated);
      if (result.authenticated) {
        loadRepositories();
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      const result = await apiClient.builds.authenticate(provider) as { authUrl: string };
      window.location.href = result.authUrl;
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const result = await apiClient.builds.fetchRepositories(provider) as { repositories: any[] };
      setRepositories(result.repositories || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedRepo) {
      toast({
        title: 'Error',
        description: 'Please select a repository',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.builds.connectRepository({
        provider,
        repositoryId: selectedRepo,
        dockerfilePath,
      });
      toast({
        title: 'Success',
        description: 'Repository connected successfully',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Repository</DialogTitle>
          <DialogDescription>
            Connect a GitHub or GitLab repository to build Docker images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </div>
                </SelectItem>
                <SelectItem value="gitlab">
                  <div className="flex items-center gap-2">
                    <Gitlab className="w-4 h-4" />
                    GitLab
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You need to authenticate with {provider === 'github' ? 'GitHub' : 'GitLab'} to continue.
              </p>
              <Button onClick={handleAuthenticate} className="w-full">
                {provider === 'github' ? <Github className="w-4 h-4 mr-2" /> : <Gitlab className="w-4 h-4 mr-2" />}
                Authenticate with {provider === 'github' ? 'GitHub' : 'GitLab'}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Repository</Label>
                <Select value={selectedRepo} onValueChange={setSelectedRepo} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dockerfile Path</Label>
                <Input
                  value={dockerfilePath}
                  onChange={(e) => setDockerfilePath(e.target.value)}
                  placeholder="Dockerfile"
                />
                <p className="text-xs text-muted-foreground">
                  Path to Dockerfile relative to repository root
                </p>
              </div>

              <Button onClick={handleConnect} disabled={loading} className="w-full">
                {loading ? 'Connecting...' : 'Connect Repository'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
