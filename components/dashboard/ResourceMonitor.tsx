'use client';

import { cn } from '@/lib/utils';
import { Cpu, MemoryStick } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Sparkline } from '@/components/ui/sparkline';
import { getThresholdLevel, getThresholdGradientClass } from '@/lib/theme-utils';
import { useCompactMode } from '@/contexts/CompactModeContext';

interface ResourceMonitorProps {
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit?: number;
  cpuHistory?: number[];
  memoryHistory?: number[];
  containerCount: number;
  className?: string;
}

export function ResourceMonitor({
  cpuUsage,
  memoryUsage,
  memoryLimit,
  cpuHistory = [],
  memoryHistory = [],
  containerCount,
  className,
}: ResourceMonitorProps) {
  const { isCompact } = useCompactMode();

  // Calculate memory limit in MB, fallback to 4096 MB if not provided
  const memoryLimitMB = memoryLimit ? Math.round(memoryLimit / (1024 * 1024)) : 4096;
  const memoryPercent = memoryLimit ? (memoryUsage / memoryLimitMB) * 100 : (memoryUsage / 4096) * 100;

  const cpuThreshold = getThresholdLevel(cpuUsage, 'cpu');
  const memoryThreshold = getThresholdLevel(memoryPercent, 'memory');

  const cpuGradientClass = getThresholdGradientClass(cpuThreshold);
  const memoryGradientClass = getThresholdGradientClass(memoryThreshold);

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
          <Cpu className="w-4 h-4 text-primary" />
        </div>
        System Resources
      </h2>

      <div className={cn('space-y-6', isCompact && 'space-y-4')}>
        {/* CPU Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                CPU Usage
              </span>
            </div>
            <div className="flex items-center gap-3">
              {cpuHistory.length > 0 && (
                <Sparkline
                  data={cpuHistory}
                  width={60}
                  height={20}
                  color={`hsl(var(--status-${cpuThreshold === 'normal' ? 'running' : cpuThreshold === 'warning' ? 'warning' : 'stopped'}))`}
                  showGradient={true}
                  strokeWidth={1.5}
                />
              )}
              <span className="font-mono text-lg font-semibold tabular-nums">
                {cpuUsage.toFixed(1)}%
              </span>
            </div>
          </div>

          <Progress
            value={cpuUsage}
            showGradient={true}
            className={cn(isCompact ? "h-1" : "h-1.5")}
            indicatorClassName={cn('bg-gradient-to-r', cpuGradientClass)}
          />

          <p className="text-xs text-muted-foreground">
            Across {containerCount} running {containerCount === 1 ? 'container' : 'containers'}
          </p>
        </div>

        {/* Memory Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Memory Usage
              </span>
            </div>
            <div className="flex items-center gap-3">
              {memoryHistory.length > 0 && (
                <Sparkline
                  data={memoryHistory}
                  width={60}
                  height={20}
                  color={`hsl(var(--status-${memoryThreshold === 'normal' ? 'running' : memoryThreshold === 'warning' ? 'warning' : 'stopped'}))`}
                  showGradient={true}
                  strokeWidth={1.5}
                />
              )}
              <span className="font-mono text-lg font-semibold tabular-nums">
                {memoryUsage.toFixed(0)} MB
              </span>
            </div>
          </div>

          <Progress
            value={memoryPercent}
            showGradient={true}
            className={cn(isCompact ? "h-1" : "h-1.5")}
            indicatorClassName={cn('bg-gradient-to-r', memoryGradientClass)}
          />

          <p className="text-xs text-muted-foreground">
            of {memoryLimitMB.toLocaleString()} MB allocated
          </p>
        </div>
      </div>
    </div>
  );
}
