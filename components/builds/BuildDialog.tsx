'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Loader2, Settings } from 'lucide-react';
import { ToastAction } from '@/components/ui/toast';

interface BuildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: any;
  onSuccess: () => void;
  onOpenSettings?: () => void;
}

export function BuildDialog({ open, onOpenChange, repository, onSuccess, onOpenSettings }: BuildDialogProps) {
  const [branches, setBranches] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [dockerfiles, setDockerfiles] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDockerfile, setSelectedDockerfile] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageTag, setImageTag] = useState('latest');
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && repository) {
      loadRepositoryDetails();
    }
  }, [open, repository]);

  const loadRepositoryDetails = async () => {
    try {
      setLoading(true);
      const result: any = await apiClient.builds.getRepositoryDetails(repository.id);
      setBranches(result.branches || []);
      setTags(result.tags || []);
      setDockerfiles(result.dockerfiles || ['Dockerfile']);
      setSelectedBranch(result.defaultBranch || '');
      setSelectedDockerfile(repository.dockerfilePath || 'Dockerfile');
      setImageName(repository.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'));
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

  const handleBuild = async () => {
    if (!selectedBranch && !selectedTag) {
      toast({
        title: 'Error',
        description: 'Please select a branch or tag',
        variant: 'destructive',
      });
      return;
    }

    if (!imageName) {
      toast({
        title: 'Error',
        description: 'Please enter an image name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setBuilding(true);
      const result = await apiClient.builds.buildImage({
        repositoryId: repository.id,
        branch: selectedBranch,
        tag: selectedTag,
        dockerfilePath: selectedDockerfile,
        imageName,
        imageTag,
        autoDeploy,
      });

      toast({
        title: 'Build Started',
        description: `Building ${imageName}:${imageTag}. Check build history for progress.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      // Check for specific error types
      if (errorMessage.includes('Dockerfile not found')) {
        // Extract just the first line for the title
        const lines = errorMessage.split('\n');
        const title = lines[0];
        const description = lines.slice(1).join('\n').trim() || 'Please check your repository settings.';
        
        toast({
          title: title,
          description: description,
          variant: 'destructive',
          duration: 15000, // Show longer for important errors
          action: onOpenSettings ? (
            <ToastAction 
              altText="Open Settings" 
              onClick={() => {
                onOpenChange(false);
                onOpenSettings();
              }}
            >
              <Settings className="w-4 h-4 mr-1" />
              Fix Path
            </ToastAction>
          ) : undefined,
        });
      } else if (errorMessage.includes('Not authenticated')) {
        toast({
          title: 'Authentication Error',
          description: 'Please reconnect your Git provider',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Build Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setBuilding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Build Docker Image</DialogTitle>
          <DialogDescription>
            Build a Docker image from {repository?.fullName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>Or select a tag</Label>
                <Select value={selectedTag} onValueChange={(v) => {
                  setSelectedTag(v);
                  setSelectedBranch('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tag (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dockerfiles.length > 1 && (
              <div className="space-y-2">
                <Label>Dockerfile</Label>
                <Select value={selectedDockerfile} onValueChange={setSelectedDockerfile}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dockerfiles.map((dockerfile) => (
                      <SelectItem key={dockerfile} value={dockerfile}>
                        {dockerfile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Image Name</Label>
              <Input
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="my-app"
              />
            </div>

            <div className="space-y-2">
              <Label>Image Tag</Label>
              <Input
                value={imageTag}
                onChange={(e) => setImageTag(e.target.value)}
                placeholder="latest"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoDeploy"
                checked={autoDeploy}
                onCheckedChange={(checked) => setAutoDeploy(checked as boolean)}
              />
              <label
                htmlFor="autoDeploy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-deploy on successful build
              </label>
            </div>

            <Button onClick={handleBuild} disabled={building} className="w-full">
              {building ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Building...
                </>
              ) : (
                'Start Build'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
