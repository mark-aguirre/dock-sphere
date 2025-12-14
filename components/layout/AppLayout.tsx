'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useCompactMode } from '@/contexts/CompactModeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  headerActions?: ReactNode;
}

export function AppLayout({ children, title, description, headerActions }: AppLayoutProps) {
  const { isCompact } = useCompactMode();
  const { collapsed } = useSidebar();
  
  return (
    <div 
      className="min-h-screen bg-background"
      data-sidebar-collapsed={collapsed}
    >
      <Sidebar />
      <div 
        className={cn(
          "main-content transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          // Match sidebar widths exactly - this is crucial for proper alignment
          collapsed 
            ? "ml-16" // 64px - matches collapsed sidebar exactly
            : "ml-56 lg:ml-64" // 224px on smaller screens, 256px on lg+ screens
        )}
      >
        <Header title={title} description={description} actions={headerActions} />
        <main className={cn(
          "flex-1 p-4 sm:p-6 w-full",
          isCompact && "p-3 sm:p-4 lg:p-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
