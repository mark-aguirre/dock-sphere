'use client';

import { Container } from '@/types/docker';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Trash2, Terminal, MoreVertical, Copy, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCompactMode } from '@/contexts/CompactModeContext';
import { useState } from 'react';

interface ContainerCardProps {
  container: Container;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onRestart?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ContainerCard({
  container,
  onStart,
  onStop,
  onRestart,
  onDelete,
}: ContainerCardProps) {
  const { isCompact } = useCompactMode();
  const [copiedImage, setCopiedImage] = useState(false);
  const memoryPercent = container.memoryLimit > 0 
    ? (container.memory / container.memoryLimit) * 100 
    : 0;

  // Truncate container name based on mode and screen size
  const truncateContainerName = (name: string) => {
    // Remove common prefixes like '/' if present
    let cleanName = name.startsWith('/') ? name.slice(1) : name;
    
    // Handle common Docker Compose naming patterns (project_service_1)
    const composePattern = /^(.+)_(.+)_\d+$/;
    const composeMatch = cleanName.match(composePattern);
    if (composeMatch) {
      const [, project, service] = composeMatch;
      cleanName = `${project}/${service}`;
    }
    
    if (isCompact) {
      // More aggressive truncation for compact mode
      return cleanName.length > 14 ? `${cleanName.slice(0, 14)}...` : cleanName;
    } else {
      // Standard truncation for normal mode
      return cleanName.length > 20 ? `${cleanName.slice(0, 20)}...` : cleanName;
    }
  };

  // Truncate image name intelligently
  const truncateImageName = (image: string) => {
    // Account for copy button space - reduce available characters
    const maxLength = isCompact ? 16 : 25; // Reduced to account for copy button
    
    if (image.length <= maxLength) {
      return image;
    }

    // Split image into parts: [registry/]repository[:tag][@digest]
    const lastColonIndex = image.lastIndexOf(':');
    const hasTag = lastColonIndex > -1 && !image.substring(lastColonIndex).includes('/');
    
    if (hasTag) {
      const repo = image.substring(0, lastColonIndex);
      const tag = image.substring(lastColonIndex + 1);
      
      // Calculate available space for repo (reserve space for :tag)
      const availableRepoLength = maxLength - tag.length - 1; // -1 for ':'
      
      if (repo.length > availableRepoLength && availableRepoLength > 3) {
        // Try to preserve the end of the repo name (usually the actual image name)
        const repoSegments = repo.split('/');
        if (repoSegments.length > 1) {
          const imageName = repoSegments[repoSegments.length - 1];
          const registryPath = repoSegments.slice(0, -1).join('/');
          
          if (imageName.length <= availableRepoLength - 3) { // -3 for '...'
            const truncatedRegistry = registryPath.substring(0, availableRepoLength - imageName.length - 4); // -4 for '.../''
            return `${truncatedRegistry}.../${imageName}:${tag}`;
          }
        }
        
        // Fallback: truncate from the beginning
        return `${repo.substring(0, availableRepoLength - 3)}...:${tag}`;
      }
      
      return `${repo}:${tag}`;
    }
    
    // No tag, just truncate the image name
    // Try to preserve the actual image name if it's part of a path
    const segments = image.split('/');
    if (segments.length > 1) {
      const imageName = segments[segments.length - 1];
      const registryPath = segments.slice(0, -1).join('/');
      
      if (imageName.length <= maxLength - 3) { // -3 for '...'
        const truncatedRegistry = registryPath.substring(0, maxLength - imageName.length - 4); // -4 for '.../''
        return `${truncatedRegistry}.../${imageName}`;
      }
    }
    
    // Fallback: simple truncation
    return `${image.substring(0, maxLength - 3)}...`;
  };

  const displayName = truncateContainerName(container.name);
  const displayImage = truncateImageName(container.image);

  const handleCopyImage = async () => {
    try {
      await navigator.clipboard.writeText(container.image);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn(
      "group relative bg-card border border-border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300",
      isCompact ? "p-3" : "p-4"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className={cn("relative flex items-start justify-between", isCompact ? "mb-1.5" : "mb-2")}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn(
            "rounded-md bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
            isCompact ? "w-6 h-6" : "w-7 h-7"
          )}>
            <span className={cn(isCompact ? "text-[10px]" : "text-xs")}>🐳</span>
          </div>
          <div className="min-w-0 flex-1">
            <Link 
              href={`/containers/${container.id}`}
              className={cn(
                "font-semibold text-foreground hover:text-primary transition-colors block truncate",
                isCompact ? "text-xs" : "text-sm"
              )}
              title={container.name}
            >
              {displayName}
            </Link>
            <p className={cn("text-muted-foreground font-mono", isCompact ? "text-[9px]" : "text-[10px]")}>
              {container.id.slice(0, 12)}
            </p>
          </div>
        </div>
        <StatusBadge status={container.status} size={isCompact ? "xs" : "sm"} className="flex-shrink-0" />
      </div>

      <div className={cn("relative space-y-1.5", isCompact ? "mb-2" : "mb-3")}>
        <div className="space-y-0.5">
          <span className={cn("text-muted-foreground", isCompact ? "text-[10px]" : "text-xs")}>Image</span>
          <div className="flex items-center gap-1">
            <span className={cn(
              "font-mono text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors group-hover:bg-muted/80 truncate",
              isCompact ? "text-[10px]" : "text-[11px]"
            )} 
            style={{ maxWidth: 'calc(100% - 28px)' }} // Reserve space for copy button
            title={container.image}>
              {displayImage}
            </span>
            <button
              onClick={handleCopyImage}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded flex-shrink-0"
              title="Copy"
            >
              {copiedImage ? (
                <Check className={cn(isCompact ? "w-2.5 h-2.5" : "w-3 h-3", "text-status-running")} />
              ) : (
                <Copy className={cn(isCompact ? "w-2.5 h-2.5" : "w-3 h-3", "text-muted-foreground hover:text-foreground")} />
              )}
            </button>
          </div>
        </div>

        <div className={cn("flex items-center justify-between", isCompact ? "text-[10px]" : "text-xs")}>
          <span className="text-muted-foreground">Status</span>
          <span className={cn("text-foreground", isCompact ? "text-[9px]" : "text-[11px]")}>{container.state}</span>
        </div>

        {container.ports.length > 0 && (
          <div className={cn("flex items-center justify-between", isCompact ? "text-[10px]" : "text-xs")}>
            <span className="text-muted-foreground">Ports</span>
            <div className="flex gap-0.5 flex-wrap justify-end">
              {container.ports.map((port, i) => (
                <span
                  key={i}
                  className={cn(
                    "font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded transition-all hover:bg-primary/20",
                    isCompact ? "text-[9px]" : "text-[10px]"
                  )}
                >
                  {port.hostPort}:{port.containerPort}
                </span>
              ))}
            </div>
          </div>
        )}

        {container.status === 'running' && (
          <>
            <div className={cn("space-y-1", isCompact && "space-y-0.5")}>
              <div className={cn("flex items-center justify-between", isCompact ? "text-[10px]" : "text-[11px]")}>
                <span className="text-muted-foreground">CPU</span>
                <span className="font-mono text-foreground tabular-nums">{container.cpu.toFixed(1)}%</span>
              </div>
              <Progress 
                value={container.cpu}
                showGradient={true}
                className={cn("bg-muted", isCompact ? "h-0.5" : "h-1")}
                indicatorClassName={cn(
                  'bg-gradient-to-r',
                  container.cpu > 85 ? 'from-status-stopped/80 to-status-stopped' :
                  container.cpu > 70 ? 'from-status-warning/80 to-status-warning' :
                  'from-status-running/80 to-status-running'
                )}
              />
            </div>

            <div className={cn("space-y-1", isCompact && "space-y-0.5")}>
              <div className={cn("flex items-center justify-between", isCompact ? "text-[10px]" : "text-[11px]")}>
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono text-foreground tabular-nums">
                  {container.memory}MB / {container.memoryLimit}MB
                </span>
              </div>
              <Progress 
                value={memoryPercent}
                showGradient={true}
                className={cn("bg-muted", isCompact ? "h-0.5" : "h-1")}
                indicatorClassName={cn(
                  'bg-gradient-to-r',
                  memoryPercent > 85 ? 'from-status-stopped/80 to-status-stopped' :
                  memoryPercent > 70 ? 'from-status-warning/80 to-status-warning' :
                  'from-status-running/80 to-status-running'
                )}
              />
            </div>
          </>
        )}
      </div>

      <div className={cn("relative flex items-center gap-1.5 border-t border-border", isCompact ? "pt-1.5" : "pt-2")}>
        {container.status === 'running' ? (
          <>
            <Button
              variant="ghost"
              size={isCompact ? "xs" : "sm"}
              className="flex-1"
              onClick={() => onStop?.(container.id)}
            >
              <Square className={cn(isCompact ? "w-2.5 h-2.5 mr-0.5" : "w-3 h-3 mr-1")} />
              Stop
            </Button>
            <Button
              variant="ghost"
              size={isCompact ? "xs" : "sm"}
              className="flex-1"
              onClick={() => onRestart?.(container.id)}
            >
              <RotateCcw className={cn(isCompact ? "w-2.5 h-2.5 mr-0.5" : "w-3 h-3 mr-1")} />
              Restart
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size={isCompact ? "xs" : "sm"}
            className="flex-1 text-status-running hover:text-status-running hover:bg-status-running/10"
            onClick={() => onStart?.(container.id)}
          >
            <Play className={cn(isCompact ? "w-2.5 h-2.5 mr-0.5" : "w-3 h-3 mr-1")} />
            Start
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(isCompact && "h-7 w-7")}
            >
              <MoreVertical className={cn(isCompact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`/containers/${container.id}`} className="cursor-pointer text-xs">
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs">
              <Terminal className="w-3.5 h-3.5 mr-2" />
              Shell
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer text-xs"
              onClick={() => onDelete?.(container.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
