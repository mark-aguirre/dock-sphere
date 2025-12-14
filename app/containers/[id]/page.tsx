'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square, RotateCcw, Trash2, Terminal, Copy, Search, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ContainerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [container, setContainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [envSearch, setEnvSearch] = useState('');
  const [logs, setLogs] = useState<string>('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLines, setLogLines] = useState('100');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchContainerDetails();
    }
  }, [params.id]);

  const fetchContainerDetails = async () => {
    try {
      setLoading(true);
      const data = await apiClient.containers.get(params.id as string);
      setContainer(data);
    } catch (error: any) {
      toast({
        title: 'Error loading container',
        description: error.message || 'Failed to fetch container details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      setActionLoading(action);
      switch (action) {
        case 'start':
          await apiClient.containers.start(params.id as string);
          break;
        case 'stop':
          await apiClient.containers.stop(params.id as string);
          break;
        case 'restart':
          await apiClient.containers.restart(params.id as string);
          break;
        case 'delete':
          await apiClient.containers.remove(params.id as string);
          router.push('/containers');
          return;
      }
      toast({
        title: 'Success',
        description: `Container ${action} successful`,
      });
      fetchContainerDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Container Details" description="Loading...">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading container details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!container) {
    return (
      <AppLayout title="Container Not Found" description="Container not found">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Container not found</p>
          <Button onClick={() => router.push('/containers')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Containers
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isRunning = container.state?.Status === 'running';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Environment variable copied successfully',
    });
  };

  const filteredEnvVars = container?.config?.Env?.filter((env: string) => 
    env.toLowerCase().includes(envSearch.toLowerCase())
  ) || [];

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const data: any = await apiClient.containers.logs(params.id as string, logLines, true);
      setLogs(data.logs || 'No logs available');
    } catch (error: any) {
      toast({
        title: 'Error loading logs',
        description: error.message || 'Failed to fetch container logs',
        variant: 'destructive',
      });
      setLogs('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <AppLayout 
      title={container.name.replace(/^\//, '')} 
      description={`Container ${container.id.slice(0, 12)}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/containers')}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
          <div className="flex items-center gap-1.5">
            {isRunning ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'stop' ? (
                    <LoadingSpinner size="sm" className="mr-1.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Stop
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAction('restart')}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'restart' ? (
                    <LoadingSpinner size="sm" className="mr-1.5" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Restart
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={() => handleAction('start')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'start' ? (
                  <LoadingSpinner size="sm" className="mr-1.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                )}
                Start
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Terminal className="w-3.5 h-3.5 mr-1.5" />
              Shell
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => handleAction('delete')}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'delete' ? (
                <LoadingSpinner size="sm" className="mr-1.5" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs" onClick={() => !logs && fetchLogs()}>Logs</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="mounts">Mounts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Container Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <StatusBadge status={container.state?.Status || 'unknown'} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Image</p>
                  <p className="font-mono text-xs">{container.config?.Image}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-xs">{container.id.slice(0, 12)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-xs">{new Date(container.created).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-3">
            <div className="bg-[#0a0a0a] border border-border rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-gradient-to-r from-muted/40 to-muted/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-medium text-foreground ml-1">Container Logs</span>
                  {logs && (
                    <span className="text-[10px] text-muted-foreground">
                      ({logs.split('\n').length} lines)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={logLines}
                    onChange={(e) => setLogLines(e.target.value)}
                    className="h-6 rounded border border-border/50 bg-background/50 px-2 text-[11px]"
                  >
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="500">500</option>
                    <option value="all">All</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchLogs}
                    disabled={logsLoading}
                    className="h-6 px-2"
                  >
                    <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  {logs && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(logs)}
                      className="h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-3 min-h-[300px] max-h-[600px] overflow-auto bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f]">
                {logsLoading ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <RefreshCw className="w-5 h-5 text-muted-foreground/40 animate-spin" />
                  </div>
                ) : logs ? (
                  <div className="font-mono text-xs leading-[1.4]">
                    {logs.split('\n').map((line, index) => {
                      // Parse timestamp if present
                      const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);
                      
                      if (timestampMatch) {
                        const [, timestamp, content] = timestampMatch;
                        const time = new Date(timestamp).toLocaleTimeString('en-US', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        });
                        
                        // Determine line color based on content
                        let textColor = 'text-foreground/90';
                        if (content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) {
                          textColor = 'text-red-400';
                        } else if (content.toLowerCase().includes('warn')) {
                          textColor = 'text-yellow-400';
                        } else if (content.toLowerCase().includes('success') || content.toLowerCase().includes('started')) {
                          textColor = 'text-green-400';
                        }
                        
                        return (
                          <div key={index} className="flex gap-2">
                            <span className="text-muted-foreground/30 select-none w-6 text-right flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-blue-400/50 select-none w-16 flex-shrink-0">
                              {time}
                            </span>
                            <span className={`${textColor} whitespace-pre-wrap break-all`}>{content}</span>
                          </div>
                        );
                      }
                      
                      // Line without timestamp
                      let textColor = 'text-foreground/90';
                      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
                        textColor = 'text-red-400';
                      } else if (line.toLowerCase().includes('warn')) {
                        textColor = 'text-yellow-400';
                      } else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('started')) {
                        textColor = 'text-green-400';
                      }
                      
                      return (
                        <div key={index} className="flex gap-2">
                          <span className="text-muted-foreground/30 select-none w-6 text-right flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className={`${textColor} whitespace-pre-wrap break-all`}>{line || '\u00A0'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center">
                    <Terminal className="w-6 h-6 text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground text-xs">Click Refresh to load logs</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="network" className="mt-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Port Mappings</h3>
              {container.networkSettings?.Ports && Object.keys(container.networkSettings.Ports).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(container.networkSettings.Ports).map(([containerPort, hostPorts]: [string, any]) => (
                    <div key={containerPort} className="flex items-center justify-between py-1">
                      <Badge variant="outline" className="text-xs">{containerPort}</Badge>
                      <span className="text-muted-foreground text-xs">→</span>
                      {hostPorts && hostPorts.length > 0 ? (
                        <Badge className="text-xs">{hostPorts[0].HostPort}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not mapped</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No port mappings configured</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="environment" className="mt-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Environment Variables</h3>
                  {container.config?.Env && container.config.Env.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{container.config.Env.length}</Badge>
                  )}
                </div>
                
                {container.config?.Env && container.config.Env.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={envSearch}
                      onChange={(e) => setEnvSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                )}
              </div>
              
              {container.config?.Env && container.config.Env.length > 0 ? (
                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                  {filteredEnvVars.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 w-1/3">
                            Key
                          </th>
                          <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                            Value
                          </th>
                          <th className="w-14"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredEnvVars.map((env: string, index: number) => {
                          const [key, ...valueParts] = env.split('=');
                          const value = valueParts.join('=');
                          return (
                            <tr key={index} className="group hover:bg-accent/20 transition-colors">
                              <td className="px-4 py-2 align-top">
                                <span className="font-mono text-xs font-medium text-primary break-all">
                                  {key}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top">
                                <span className="font-mono text-xs text-foreground break-all">
                                  {value || <span className="text-muted-foreground italic">empty</span>}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(`${key}=${value}`)}
                                  title="Copy"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted-foreground text-xs text-center py-6 px-4">
                      No environment variables match your search
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs px-4 pb-4">No environment variables configured</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mounts" className="mt-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Volume Mounts</h3>
              {container.mounts && container.mounts.length > 0 ? (
                <div className="space-y-2">
                  {container.mounts.map((mount: any, index: number) => (
                    <div key={index} className="border border-border rounded-md p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-xs">{mount.Type}</Badge>
                        <Badge variant={mount.RW ? 'default' : 'secondary'} className="text-xs">
                          {mount.RW ? 'RW' : 'RO'}
                        </Badge>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">Source: </span>
                          <span className="font-mono">{mount.Source || mount.Name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dest: </span>
                          <span className="font-mono">{mount.Destination}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No volume mounts configured</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
