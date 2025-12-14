'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Shield, Bell, Settings, ExternalLink } from 'lucide-react';


import { useRouter } from 'next/navigation';



export default function SettingsPage() {
  const router = useRouter();

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



        <div className="flex justify-end gap-3">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </AppLayout>
  );
}
