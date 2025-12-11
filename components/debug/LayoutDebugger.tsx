'use client';

import { useCompactMode } from '@/contexts/CompactModeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface LayoutDebuggerProps {
  enabled?: boolean;
}

export function LayoutDebugger({ enabled = false }: LayoutDebuggerProps) {
  const { isCompact } = useCompactMode();
  const { collapsed } = useSidebar();

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div>Sidebar: {collapsed ? 'Collapsed (64px)' : `Expanded (${isCompact ? '224px' : '224px lg:256px'})`}</div>
      <div>Compact Mode: {isCompact ? 'On' : 'Off'}</div>
      <div>Screen: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'}</div>
    </div>
  );
}