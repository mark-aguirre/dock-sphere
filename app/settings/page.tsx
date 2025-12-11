'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Server, Shield, Bell, Palette, GitBranch, Eye, EyeOff, Settings, ExternalLink } from 'lucide-react';
import { useCompactMode } from '@/contexts/CompactModeContext';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface OAuthConfig {
  github?: {
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
  gitlab?: {
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
}

export default function SettingsPage() {
  const { isCompact, setIsCompact } = useCompactMode();
  const { toast } = useToast();
  const router = useRouter();
  const [dockerConfig, setDockerConfig] = useState<{
    platform: string;
    socketPath: string;
    envVar: string;
  } | null>(null);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig>({});
  const [showSecrets, setShowSecrets] = useState({ github: false, gitlab: false });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/docker/config')
      .then(res => res.json())
      .then(data => setDockerConfig(data))
      .catch(err => console.error('Failed to fetch Docker config:', err));

    fetch('/api/settings/oauth')
      .then(res => res.json())
      .then(data => setOauthConfig(data))
      .catch(err => console.error('Failed to fetch OAuth config:', err));
  }, []);

  const handleOAuthSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oauthConfig),
      });

      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'OAuth configuration has been updated successfully.',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save OAuth configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSetup = () => {
    router.push('/setup');
  };
  
  return (
    <AppLayout title="Settings" description="Configure DockSphere">
      <div className="max-w-2xl space-y-8">
        {/* Environment Setup */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Environment Setup</h2>
          </div>
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium">Configure Environment Variables</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up Docker, authentication, database, and OAuth provider settings through a guided setup wizard.
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    Docker socket configuration
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    NextAuth authentication setup
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    Supabase database connection
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    OAuth providers (Google, GitHub, GitLab)
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleOpenSetup}
                className="ml-4 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Open Setup
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> The setup wizard will guide you through configuring all environment variables 
                and will automatically create backups before making changes to your .env file.
              </p>
            </div>
          </div>
        </div>

        {/* Docker Connection */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Docker Connection</h2>
          </div>
          <Separator />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docker-host">Docker Host</Label>
              <Input
                id="docker-host"
                value={dockerConfig?.socketPath || 'Loading...'}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Current connection: {dockerConfig?.platform === 'win32' ? 'Windows Named Pipe' : 'Unix Socket'}
                {dockerConfig?.envVar !== 'not set' && ` (from DOCKER_SOCKET env)`}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>TLS Verification</Label>
                <p className="text-xs text-muted-foreground">
                  Verify TLS certificates for remote connections
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Git OAuth Integration */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Git OAuth Integration</h2>
          </div>
          <Separator />
          
          <div className="space-y-6">
            {/* GitHub */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">GitHub</Label>
                <Switch
                  checked={oauthConfig.github?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setOauthConfig({
                      ...oauthConfig,
                      github: { ...oauthConfig.github!, enabled: checked },
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="github-client-id">Client ID</Label>
                <Input
                  id="github-client-id"
                  value={oauthConfig.github?.clientId || ''}
                  onChange={(e) =>
                    setOauthConfig({
                      ...oauthConfig,
                      github: {
                        ...oauthConfig.github!,
                        clientId: e.target.value,
                        enabled: oauthConfig.github?.enabled ?? false,
                      },
                    })
                  }
                  placeholder="Enter GitHub OAuth Client ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github-client-secret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="github-client-secret"
                    type={showSecrets.github ? 'text' : 'password'}
                    value={oauthConfig.github?.clientSecret || ''}
                    onChange={(e) =>
                      setOauthConfig({
                        ...oauthConfig,
                        github: {
                          ...oauthConfig.github!,
                          clientSecret: e.target.value,
                          enabled: oauthConfig.github?.enabled ?? false,
                        },
                      })
                    }
                    placeholder="Enter GitHub OAuth Client Secret"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowSecrets({ ...showSecrets, github: !showSecrets.github })
                    }
                  >
                    {showSecrets.github ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Callback URL: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/builds/auth/github/callback
                </p>
              </div>
            </div>

            <Separator />

            {/* GitLab */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">GitLab</Label>
                <Switch
                  checked={oauthConfig.gitlab?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setOauthConfig({
                      ...oauthConfig,
                      gitlab: { ...oauthConfig.gitlab!, enabled: checked },
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gitlab-client-id">Application ID</Label>
                <Input
                  id="gitlab-client-id"
                  value={oauthConfig.gitlab?.clientId || ''}
                  onChange={(e) =>
                    setOauthConfig({
                      ...oauthConfig,
                      gitlab: {
                        ...oauthConfig.gitlab!,
                        clientId: e.target.value,
                        enabled: oauthConfig.gitlab?.enabled ?? false,
                      },
                    })
                  }
                  placeholder="Enter GitLab Application ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gitlab-client-secret">Secret</Label>
                <div className="relative">
                  <Input
                    id="gitlab-client-secret"
                    type={showSecrets.gitlab ? 'text' : 'password'}
                    value={oauthConfig.gitlab?.clientSecret || ''}
                    onChange={(e) =>
                      setOauthConfig({
                        ...oauthConfig,
                        gitlab: {
                          ...oauthConfig.gitlab!,
                          clientSecret: e.target.value,
                          enabled: oauthConfig.gitlab?.enabled ?? false,
                        },
                      })
                    }
                    placeholder="Enter GitLab Application Secret"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowSecrets({ ...showSecrets, gitlab: !showSecrets.gitlab })
                    }
                  >
                    {showSecrets.gitlab ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Callback URL: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/builds/auth/gitlab/callback
                </p>
              </div>
            </div>

            <Button onClick={handleOAuthSave} disabled={isSaving} className="w-full">
              {isSaving ? 'Saving...' : 'Save OAuth Settings'}
            </Button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Require login to access Container Manager
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Privileged Containers</Label>
                <p className="text-xs text-muted-foreground">
                  Allow creating containers with privileged mode
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Restrict Host Binds</Label>
                <p className="text-xs text-muted-foreground">
                  Limit which host paths can be mounted
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Container State Changes</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when containers start, stop, or crash
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Resource Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when CPU or memory usage is high
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Image Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when new image versions are available
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          <Separator />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stats Refresh Interval</Label>
              <Input
                type="number"
                defaultValue="2"
                min="1"
                max="60"
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                How often to refresh container statistics (seconds)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Show more items with less spacing
                </p>
              </div>
              <Switch 
                checked={isCompact} 
                onCheckedChange={setIsCompact} 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </AppLayout>
  );
}
