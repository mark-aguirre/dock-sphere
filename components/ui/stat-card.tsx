'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';
import { Skeleton } from './skeleton';
import { useCompactMode } from '@/contexts/CompactModeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  loading?: boolean;
  glassmorphism?: boolean;
}

export function StatCard({
  title,
  value,
  previousValue,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  loading = false,
  glassmorphism = false,
}: StatCardProps) {
  const { isCompact } = useCompactMode();

  const variants = {
    default: 'bg-card border-border',
    primary: 'bg-primary/5 border-primary/20',
    success: 'bg-status-running/5 border-status-running/20',
    warning: 'bg-status-warning/5 border-status-warning/20',
    danger: 'bg-status-stopped/5 border-status-stopped/20',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-status-running/10 text-status-running',
    warning: 'bg-status-warning/10 text-status-warning',
    danger: 'bg-status-stopped/10 text-status-stopped',
  };

  const glowVariants = {
    default: '',
    primary: 'hover:shadow-primary/20',
    success: 'hover:shadow-status-running/20',
    warning: 'hover:shadow-status-warning/20',
    danger: 'hover:shadow-status-stopped/20',
  };

  // Calculate trend from previous value if provided
  const calculatedTrend = previousValue !== undefined && typeof value === 'number'
    ? {
        value: previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : 0,
        label: trend?.label || 'vs previous',
      }
    : trend;

  if (loading) {
    return <Skeleton className={cn("h-20 rounded-xl", className)} />;
  }

  const isNumericValue = typeof value === 'number';

  return (
    <div
      className={cn(
        'group relative transition-all duration-300 rounded-xl overflow-hidden',
        isCompact ? 'py-3 px-4' : 'py-4 px-5',
        glassmorphism ? 'bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300' : cn(
          variants[variant],
          'border-l-4',
          variant === 'primary' && 'border-l-primary',
          variant === 'success' && 'border-l-status-running',
          variant === 'warning' && 'border-l-status-warning',
          variant === 'danger' && 'border-l-status-stopped',
          variant === 'default' && 'border-l-border',
          'hover:bg-muted/30'
        ),
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Icon and Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex-shrink-0 transition-colors duration-200',
              iconVariants[variant]
            )}
          >
            <Icon className={cn(isCompact ? 'w-4 h-4' : 'w-5 h-5')} />
          </div>
          <p className={cn('font-medium text-muted-foreground truncate', isCompact ? 'text-xs' : 'text-sm')}>
            {title}
          </p>
        </div>

        {/* Right side: Value and Trend */}
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <div className={cn('font-bold tracking-tight text-foreground', isCompact ? 'text-lg' : 'text-2xl')}>
            {isNumericValue ? (
              <AnimatedCounter value={value} duration={500} />
            ) : (
              value
            )}
          </div>
          {calculatedTrend && !isCompact && (
            <span
              className={cn(
                'text-xs font-medium',
                calculatedTrend.value >= 0
                  ? 'text-status-running'
                  : 'text-status-stopped'
              )}
            >
              {calculatedTrend.value >= 0 ? '+' : ''}
              {calculatedTrend.value.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
