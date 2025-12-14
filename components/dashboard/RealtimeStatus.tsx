'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeStatusProps {
  statsConnected: boolean;
  eventsConnected: boolean;
  className?: string;
}

export function RealtimeStatus({ 
  statsConnected, 
  eventsConnected, 
  className 
}: RealtimeStatusProps) {
  const allConnected = statsConnected && eventsConnected;
  const someConnected = statsConnected || eventsConnected;
  
  const getStatusInfo = () => {
    if (allConnected) {
      return {
        icon: Wifi,
        variant: 'default' as const,
        text: 'Real-time',
        description: 'All real-time features connected'
      };
    } else if (someConnected) {
      return {
        icon: AlertCircle,
        variant: 'secondary' as const,
        text: 'Partial',
        description: `Stats: ${statsConnected ? 'Connected' : 'Disconnected'}, Events: ${eventsConnected ? 'Connected' : 'Disconnected'}`
      };
    } else {
      return {
        icon: WifiOff,
        variant: 'destructive' as const,
        text: 'Polling',
        description: 'Using fallback polling mode'
      };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={status.variant}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium cursor-help",
              className
            )}
          >
            <Icon className="w-3 h-3" />
            {status.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium mb-1">{status.description}</div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Stats: {statsConnected ? '✓ Connected' : '✗ Disconnected'}</div>
              <div>Events: {eventsConnected ? '✓ Connected' : '✗ Disconnected'}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}