'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassShowcaseProps {
  children: ReactNode;
  variant?: 'card' | 'stat' | 'depth-1' | 'depth-2';
  className?: string;
  floating?: boolean;
}

export function GlassShowcase({
  children,
  variant = 'card',
  className,
  floating = false,
}: GlassShowcaseProps) {
  const variants = {
    card: 'bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300',
    stat: 'bg-card border border-border shadow-sm',
    'depth-1': 'bg-card border border-border shadow-md',
    'depth-2': 'bg-card border border-border shadow-lg',
  };

  return (
    <div
      className={cn(
        variants[variant],
        floating && 'animate-float',
        'rounded-xl p-4',
        className
      )}
    >
      {children}
    </div>
  );
}