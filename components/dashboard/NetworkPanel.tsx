'use client';

import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { useCompactMode } from '@/contexts/CompactModeContext';

interface NetworkPanelProps {
  inbound: number; // MB
  outbound: number; // MB
  totalToday: number; // MB
  className?: string;
}

export function NetworkPanel({
  inbound,
  outbound,
  totalToday,
  className,
}: NetworkPanelProps) {
  const { isCompact } = useCompactMode();

  const formatSpeed = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb * 1024).toFixed(0)} KB`;
  };

  const formatSize = (mb: number): string => {
    if (mb >= 1024 * 1024) {
      return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
    }
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb * 1024).toFixed(0)} KB`;
  };

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-all duration-300',
        isCompact ? 'p-4' : 'p-5',
        className
      )}
    >
      <h2
        className={cn(
          'font-semibold flex items-center gap-2',
          isCompact ? 'text-base mb-3' : 'text-lg mb-4'
        )}
      >
        <div className="p-2 rounded-lg bg-primary/10">
          <ArrowUpDown className="w-4 h-4 text-primary" />
        </div>
        Network I/O
      </h2>

      <div className="space-y-3">
        {/* Inbound */}
        <div className="flex items-center justify-between py-2.5 border-b border-border group hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-status-running/10">
              <ArrowDown className="w-3.5 h-3.5 text-status-running" />
            </div>
            <span className="text-sm text-muted-foreground">Inbound Total</span>
          </div>
          <span className="font-mono text-sm font-semibold text-status-running tabular-nums">
            {formatSpeed(inbound)}
          </span>
        </div>

        {/* Outbound */}
        <div className="flex items-center justify-between py-2.5 border-b border-border group hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <ArrowUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Outbound Total</span>
          </div>
          <span className="font-mono text-sm font-semibold text-primary tabular-nums">
            {formatSpeed(outbound)}
          </span>
        </div>

        {/* Total Today */}
        <div className="flex items-center justify-between py-2.5 group hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Total Today</span>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatSize(totalToday)}
          </span>
        </div>
      </div>
    </div>
  );
}
