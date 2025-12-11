import { cn } from '@/lib/utils';
import { Container } from '@/types/docker';

interface StatusBadgeProps {
  status: Container['status'];
  className?: string;
  size?: 'xs' | 'sm' | 'default';
}

export function StatusBadge({ status, className, size = 'default' }: StatusBadgeProps) {
  const statusConfig = {
    running: {
      bg: 'bg-status-running/10',
      text: 'text-status-running',
      dot: 'bg-status-running',
      label: 'Running',
    },
    stopped: {
      bg: 'bg-status-stopped/10',
      text: 'text-status-stopped',
      dot: 'bg-status-stopped',
      label: 'Stopped',
    },
    paused: {
      bg: 'bg-status-paused/10',
      text: 'text-status-paused',
      dot: 'bg-status-paused',
      label: 'Paused',
    },
    restarting: {
      bg: 'bg-status-warning/10',
      text: 'text-status-warning',
      dot: 'bg-status-warning animate-pulse',
      label: 'Restarting',
    },
    created: {
      bg: 'bg-status-info/10',
      text: 'text-status-info',
      dot: 'bg-status-info',
      label: 'Created',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'xs' ? 'gap-0.5 px-1.5 py-0.5 text-[9px]' :
        size === 'sm' ? 'gap-1 px-2 py-0.5 text-[10px]' : 
        'gap-1.5 px-2.5 py-1 text-xs',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn(
        'rounded-full', 
        config.dot,
        size === 'xs' ? 'w-0.5 h-0.5' :
        size === 'sm' ? 'w-1 h-1' : 
        'w-1.5 h-1.5'
      )} />
      {config.label}
    </span>
  );
}
