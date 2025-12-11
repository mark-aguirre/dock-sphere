'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatsGridProps {
  children: ReactNode;
  layout?: 'default' | 'bento';
  className?: string;
}

export function StatsGrid({
  children,
  layout = 'default',
  className,
}: StatsGridProps) {
  const layouts = {
    default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4',
    bento: cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4',
      // Bento box asymmetric layout
      '[&>*:nth-child(1)]:md:col-span-2',
      '[&>*:nth-child(4)]:lg:col-span-2'
    ),
  };

  return (
    <div className={cn(layouts[layout], className)}>
      {children}
    </div>
  );
}
