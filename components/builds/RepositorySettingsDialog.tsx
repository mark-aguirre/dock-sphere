'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface RepositorySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: any;
  onSuccess: () => void;
}

export function RepositorySettingsDialog({ 
  open, 
  onOpenChange, 
  repository, 
  onSuccess 
}: RepositorySettingsDialogProps) {
  const [dockerfilePath, setDockerfilePath] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && repository) {
      setDockerfilePath(repository.dockerfilePath || 'Dockerfile');
    }
  }, [open, repository]);

  const handleSave = async () => {
    if (!dockerfilePath.trim()) {
      toast({
        title: 'Error',
        description: 'Dockerfile path cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await apiClient.builds.updateRepository(repository.id, {
        dockerfilePath: dockerfilePath.trim(),
      });

      toast({
        title: 'Settings Updated',
        description: 'Repository settings have been saved',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Repository Settings</DialogTitle>
          <DialogDescription>
            Configure build settings for {repository?.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Dockerfile Path</Label>
            <Input
              value={dockerfilePath}
              onChange={(e) => setDockerfilePath(e.target.value)}
              placeholder="Dockerfile"
            />
            <p className="text-xs text-muted-foreground">
              Path to the Dockerfile relative to repository root (e.g., "Dockerfile", "docker/Dockerfile", "backend/Dockerfile")
            </p>
          </div>

          <div className="space-y-2">
            <Label>Repository Info</Label>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Name: {repository?.name}</div>
              <div>Full Name: {repository?.fullName}</div>
              <div>Default Branch: {repository?.defaultBranch}</div>
              <div>Provider: {repository?.provider}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
