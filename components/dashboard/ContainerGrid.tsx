'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useCompactMode } from '@/contexts/CompactModeContext';

interface ContainerGridProps {
  children: ReactNode;
  layout?: 'grid' | 'masonry' | 'bento';
  className?: string;
}

export function ContainerGrid({
  children,
  layout = 'grid',
  className,
}: ContainerGridProps) {
  const { isCompact } = useCompactMode();

  const layouts = {
    grid: cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      isCompact ? 'gap-2 lg:gap-3' : 'gap-3 lg:gap-4'
    ),
    masonry: cn(
      // CSS Grid masonry-like layout
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-auto',
      isCompact ? 'gap-2 lg:gap-3' : 'gap-3 lg:gap-4'
    ),
    bento: cn(
      // Bento box asymmetric layout
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      isCompact ? 'gap-2 lg:gap-3' : 'gap-3 lg:gap-4',
      '[&>*:nth-child(3n+1)]:lg:col-span-2',
      '[&>*:nth-child(5n)]:md:col-span-2'
    ),
  };

  return (
    <div className={cn(layouts[layout], className)}>
      {children}
    </div>
  );
}
