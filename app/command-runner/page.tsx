'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Square, Trash2, History, Copy, ChevronRight, PanelRightClose, PanelRightOpen, Zap, Terminal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface CommandHistoryItem {
  command: string;
  output: string;
  exitCode: number;
  timestamp: Date;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: string;
}

export default function CommandRunnerPage() {
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'quick'>('history');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Docker command suggestions
  const dockerCommands: CommandSuggestion[] = [
    { command: 'docker ps', description: 'List running containers', category: 'Container' },
    { command: 'docker ps -a', description: 'List all containers', category: 'Container' },
    { command: 'docker images', description: 'List all images', category: 'Image' },
    { command: 'docker pull', description: 'Pull an image from registry', category: 'Image' },
    { command: 'docker run', description: 'Run a container from image', category: 'Container' },
    { command: 'docker start', description: 'Start stopped container', category: 'Container' },
    { command: 'docker stop', description: 'Stop running container', category: 'Container' },
    { command: 'docker restart', description: 'Restart container', category: 'Container' },
    { command: 'docker rm', description: 'Remove container', category: 'Container' },
    { command: 'docker rmi', description: 'Remove image', category: 'Image' },
    { command: 'docker logs', description: 'View container logs', category: 'Container' },
    { command: 'docker exec', description: 'Execute command in container', category: 'Container' },
    { command: 'docker inspect', description: 'Display detailed information', category: 'Info' },
    { command: 'docker network ls', description: 'List networks', category: 'Network' },
    { command: 'docker network create', description: 'Create a network', category: 'Network' },
    { command: 'docker network rm', description: 'Remove network', category: 'Network' },
    { command: 'docker volume ls', description: 'List volumes', category: 'Volume' },
    { command: 'docker volume create', description: 'Create a volume', category: 'Volume' },
    { command: 'docker volume rm', description: 'Remove volume', category: 'Volume' },
    { command: 'docker build', description: 'Build image from Dockerfile', category: 'Image' },
    { command: 'docker push', description: 'Push image to registry', category: 'Image' },
    { command: 'docker compose up', description: 'Start services', category: 'Compose' },
    { command: 'docker compose down', description: 'Stop services', category: 'Compose' },
    { command: 'docker system df', description: 'Show disk usage', category: 'System' },
    { command: 'docker system prune', description: 'Clean up unused data', category: 'System' },
    { command: 'docker stats', description: 'Display resource usage', category: 'Info' },
    { command: 'docker stats --no-stream', description: 'Display resource usage once', category: 'Info' },
    { command: 'docker top', description: 'Display running processes', category: 'Info' },
    { command: 'docker version', description: 'Show Docker version', category: 'Info' },
    { command: 'docker info', description: 'Display system information', category: 'Info' },
  ];

  // Filter suggestions based on input
  const filteredSuggestions = command.trim()
    ? dockerCommands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(command.toLowerCase()) ||
          cmd.description.toLowerCase().includes(command.toLowerCase())
      )
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleRun = async () => {
    if (!command.trim()) return;
    
    setIsRunning(true);
    setOutput(`$ ${command}\n\nExecuting...\n`);
    
    try {
      const result = await apiClient.commands.execute(command) as any;
      
      const fullOutput = `$ ${command}\n\n${result.output}\n\nExit code: ${result.exitCode}\nDuration: ${result.duration}ms`;
      setOutput(fullOutput);
      
      // Add to history
      setHistory((prev) => [
        {
          command,
          output: result.output,
          exitCode: result.exitCode,
          timestamp: new Date(result.timestamp),
        },
        ...prev.slice(0, 19), // Keep last 20 commands
      ]);

      if (result.exitCode === 0) {
        toast({
          title: 'Command executed successfully',
          description: `Completed in ${result.duration}ms`,
        });
      } else {
        toast({
          title: 'Command failed',
          description: `Exit code: ${result.exitCode}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorOutput = `$ ${command}\n\nError: ${error.message}\n\n${error.suggestions?.join('\n') || ''}`;
      setOutput(errorOutput);
      
      toast({
        title: 'Command execution failed',
        description: error.message,
        variant: 'destructive',
      });
      
      // Add error to history
      setHistory((prev) => [
        {
          command,
          output: error.message,
          exitCode: 1,
          timestamp: new Date(),
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setOutput((prev) => prev + '\n\n^C Operation cancelled.');
    toast({
      title: 'Command cancelled',
      description: 'Operation was stopped by user',
    });
  };

  const handleClear = () => {
    setOutput('');
    setCommand('');
    setShowSuggestions(false);
  };

  const handleCommandChange = (value: string) => {
    setCommand(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(0);
  };

  const selectSuggestion = (suggestion: string) => {
    setCommand(suggestion + ' ');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter key - run command
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        selectSuggestion(filteredSuggestions[selectedSuggestionIndex].command);
      } else if (command.trim()) {
        handleRun();
      }
      return;
    }

    // Ctrl+Enter - also run command
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleRun();
      return;
    }

    // Arrow down - navigate suggestions
    if (e.key === 'ArrowDown' && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    // Arrow up - navigate suggestions
    if (e.key === 'ArrowUp' && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
      return;
    }

    // Escape - close suggestions
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    // Tab - accept suggestion
    if (e.key === 'Tab' && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      selectSuggestion(filteredSuggestions[selectedSuggestionIndex].command);
      return;
    }
  };

  // Format output with syntax highlighting
  const formatOutput = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Command line (starts with $)
      if (line.startsWith('$ ')) {
        return (
          <div key={index} className="flex gap-3 mb-2">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-primary font-semibold whitespace-pre">{line}</span>
          </div>
        );
      }
      // Error lines
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
        return (
          <div key={index} className="flex gap-3">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-red-400 whitespace-pre">{line}</span>
          </div>
        );
      }
      // Success indicators
      if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
        return (
          <div key={index} className="flex gap-3">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-green-400 whitespace-pre">{line}</span>
          </div>
        );
      }
      // Exit code and duration
      if (line.startsWith('Exit code:') || line.startsWith('Duration:')) {
        return (
          <div key={index} className="flex gap-3 mt-2">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-blue-400 font-medium whitespace-pre">{line}</span>
          </div>
        );
      }
      // Container IDs (12 char hex)
      if (/^[a-f0-9]{12}/.test(line.trim())) {
        return (
          <div key={index} className="flex gap-3">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-cyan-400 whitespace-pre">{line}</span>
          </div>
        );
      }
      // Headers (ALL CAPS or contains multiple spaces for table headers)
      if (line === line.toUpperCase() && line.trim().length > 0 && /[A-Z\s]{10,}/.test(line)) {
        return (
          <div key={index} className="flex gap-3">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-yellow-400 font-semibold whitespace-pre">{line}</span>
          </div>
        );
      }
      // Empty lines
      if (line.trim() === '') {
        return (
          <div key={index} className="flex gap-3 h-5">
            <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span>&nbsp;</span>
          </div>
        );
      }
      // Default
      return (
        <div key={index} className="flex gap-3">
          <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-foreground/90 whitespace-pre">{line}</span>
        </div>
      );
    });
  };

  return (
    <AppLayout 
      title="Command Runner" 
      description="Execute Docker commands with real-time output"
    >
      <div className="relative flex gap-0">
        {/* Main Command Area */}
        <div className={cn(
          "space-y-4 transition-all duration-500 ease-in-out",
          isSidebarCollapsed ? "w-full pr-6" : "w-full lg:w-2/3 pr-6"
        )}>
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <span className="text-primary">$</span>
                <span>Enter Docker command</span>
              </div>
              {!isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <PanelRightClose className="w-4 h-4 mr-1" />
                  <span className="text-xs">Hide Panel</span>
                </Button>
              )}
            </div>
            
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Textarea
                ref={inputRef}
                value={command}
                onChange={(e) => handleCommandChange(e.target.value)}
                placeholder="docker ps -a"
                className="font-mono text-sm min-h-[80px] bg-terminal-bg text-foreground border-border resize-none"
                onKeyDown={handleKeyDown}
                onFocus={() => command.trim() && setShowSuggestions(true)}
              />
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-[300px] overflow-auto">
                  <div className="p-2 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Terminal className="w-3 h-3" />
                      <span>{filteredSuggestions.length} suggestions</span>
                      <span className="ml-auto text-[10px]">↑↓ navigate • Enter/Tab select • Esc close</span>
                    </div>
                  </div>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(suggestion.command)}
                      className={cn(
                        'w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-l-2',
                        index === selectedSuggestionIndex
                          ? 'bg-muted border-primary'
                          : 'border-transparent'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-foreground truncate">
                            {suggestion.command}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {suggestion.description}
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
                          {suggestion.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isRunning ? (
                <LoadingButton 
                  variant="destructive" 
                  onClick={handleStop}
                  loading={false}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </LoadingButton>
              ) : (
                <LoadingButton 
                  onClick={handleRun} 
                  disabled={!command.trim()}
                  loading={isRunning}
                  loadingText="Running..."
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </LoadingButton>
              )}
              <Button variant="outline" onClick={handleClear} disabled={isRunning}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                Press Enter to run • Ctrl+Enter also works
              </span>
            </div>
          </div>

          {/* Output */}
          <div className="bg-[#0a0a0a] border border-border rounded-xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-gradient-to-r from-muted/40 to-muted/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-sm font-medium text-foreground ml-2">Terminal Output</span>
              </div>
              {output && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {output.split('\n').length} lines
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="h-7"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              )}
            </div>
            <div className="p-4 min-h-[300px] max-h-[500px] overflow-auto bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f]">
              {output ? (
                <div className="font-mono text-[13px] leading-5">
                  {formatOutput(output)}
                  {isRunning && (
                    <div className="flex gap-3 mt-1">
                      <span className="text-muted-foreground/40 select-none text-xs leading-5 w-8 text-right flex-shrink-0">
                        {output.split('\n').length + 1}
                      </span>
                      <span className="inline-flex items-center gap-2 text-primary">
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
                        <span className="text-muted-foreground text-xs">Running...</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <div className="p-3 rounded-full bg-muted/10 mb-3">
                    <Play className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">Ready to execute</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">
                    Enter a command and press Run or Ctrl+Enter
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vertical Toggle Bar - Shows when collapsed */}
        {isSidebarCollapsed && (
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="group flex flex-col items-center gap-2 bg-card border-l border-t border-b border-border rounded-l-xl py-6 px-2 hover:px-3 transition-all duration-300 shadow-lg hover:shadow-xl"
              title="Show sidebar"
            >
              <PanelRightOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex flex-col gap-1">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors writing-mode-vertical transform rotate-180">
                PANEL
              </span>
            </button>
          </div>
        )}

        {/* Sidebar Panel with Tabs */}
        <div className={cn(
          "transition-all duration-500 ease-in-out flex-shrink-0 overflow-hidden",
          isSidebarCollapsed 
            ? "w-0 opacity-0 translate-x-full" 
            : "w-full lg:w-1/3 opacity-100 translate-x-0"
        )}>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full">
            {/* Header with Tabs */}
            <div className="border-b border-border bg-muted/20">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    {activeTab === 'history' ? (
                      <History className="w-4 h-4 text-primary" />
                    ) : (
                      <Zap className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="font-medium text-sm">
                    {activeTab === 'history' ? 'Command History' : 'Quick Commands'}
                  </span>
                  {activeTab === 'history' && history.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ({history.length})
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Hide sidebar"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              
              {/* Tab Buttons */}
              <div className="flex border-t border-border">
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium transition-all relative",
                    activeTab === 'history'
                      ? "text-primary bg-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <History className="w-4 h-4" />
                    <span>History</span>
                    {history.length > 0 && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        activeTab === 'history' 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {history.length}
                      </span>
                    )}
                  </div>
                  {activeTab === 'history' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('quick')}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium transition-all relative",
                    activeTab === 'quick'
                      ? "text-primary bg-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Quick</span>
                  </div>
                  {activeTab === 'quick' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {activeTab === 'history' ? (
                <div className="divide-y divide-border">
                  {history.length === 0 ? (
                    <div className="p-8 text-center">
                      <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No command history yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Run commands to see them here
                      </p>
                    </div>
                  ) : (
                    history.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setCommand(item.command)}
                        className="w-full text-left p-3 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs text-primary truncate max-w-[200px] group-hover:text-primary/80">
                            $ {item.command}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded',
                              item.exitCode === 0
                                ? 'bg-status-running/10 text-status-running'
                                : 'bg-status-stopped/10 text-status-stopped'
                            )}
                          >
                            {item.exitCode}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {[
                    { cmd: 'docker ps -a', desc: 'List all containers' },
                    { cmd: 'docker images', desc: 'List all images' },
                    { cmd: 'docker network ls', desc: 'List networks' },
                    { cmd: 'docker volume ls', desc: 'List volumes' },
                    { cmd: 'docker system df', desc: 'Show disk usage' },
                    { cmd: 'docker stats --no-stream', desc: 'Container stats' },
                    { cmd: 'docker system prune', desc: 'Clean up unused data' },
                  ].map(({ cmd, desc }) => (
                    <button
                      key={cmd}
                      onClick={() => setCommand(cmd)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted hover:border-primary/20 border border-transparent transition-all duration-200 group"
                    >
                      <div className="font-mono text-sm text-foreground group-hover:text-primary transition-colors">
                        {cmd}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {desc}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
