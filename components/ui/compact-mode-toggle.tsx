'use client';

import { Monitor, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompactMode } from '@/contexts/CompactModeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CompactModeToggle() {
  const { isCompact, setIsCompact } = useCompactMode();

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCompact(!isCompact)}
          className="transition-all hover:bg-muted hover:scale-110"
        >
          {isCompact ? (
            <Monitor className="w-4 lg:w-5 h-4 lg:h-5" />
          ) : (
            <Laptop className="w-4 lg:w-5 h-4 lg:h-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-medium">
        {isCompact ? 'Switch to Desktop View' : 'Switch to Laptop View'}
      </TooltipContent>
    </Tooltip>
  );
}