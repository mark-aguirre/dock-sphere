'use client';

import { Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { CompactModeToggle } from '@/components/ui/compact-mode-toggle';
import { GlobalSearchDialog } from '@/components/search/GlobalSearchDialog';
import { NotificationCenter, useNotifications } from '@/components/ui/notification-center';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll
  } = useNotifications();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Global search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 bg-background border-b border-border shadow-sm flex items-center justify-between px-4 lg:px-6">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-50" />

      <div className="relative flex-1 min-w-0 mr-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg lg:text-xl font-semibold text-foreground truncate" title={title}>{title}</h1>
          {description && (
            <p className="text-xs lg:text-sm text-muted-foreground truncate" title={description}>{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-2 lg:gap-3">
        {/* Global search */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted/30 active:bg-muted/40 active:scale-[0.98] min-w-[200px] justify-start transition-all duration-150"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="sm:hidden h-8 w-8 hover:bg-muted/30 active:bg-muted/40 active:scale-[0.95] transition-all duration-150"
        >
          <Search className="h-4 w-4" />
        </Button>

        <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Compact mode toggle */}
        <CompactModeToggle />

        {/* Theme toggle with animation */}
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="transition-all hover:bg-muted hover:scale-110 h-8 w-8 lg:h-10 lg:w-10"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 lg:w-5 h-4 lg:h-5 transition-transform rotate-0 hover:rotate-12" />
            ) : (
              <Moon className="w-4 lg:w-5 h-4 lg:h-5 transition-transform rotate-0 hover:-rotate-12" />
            )}
          </Button>
        )}

        {/* Notification center */}
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismissNotification}
          onClearAll={clearAll}
        />

        {/* User profile menu */}
        <UserMenu />
      </div>
    </header>
  );
}
