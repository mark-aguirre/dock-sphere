'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  Container,
  Box,
  Network,
  HardDrive,
  LayoutTemplate,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Container, label: 'Containers', path: '/containers' },
  { icon: Box, label: 'Images', path: '/images' },
  { icon: GitBranch, label: 'Builds', path: '/builds' },
  { icon: Network, label: 'Networks', path: '/networks' },
  { icon: HardDrive, label: 'Volumes', path: '/volumes' },
  { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
  { icon: Terminal, label: 'Command Runner', path: '/command-runner' },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar-background border-r border-sidebar-border shadow-lg transition-all duration-300 ease-in-out',
        'transform-gpu will-change-[width]', // Hardware acceleration for smooth transitions
        collapsed ? 'w-16' : 'w-56 lg:w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 lg:px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-7 lg:w-8 h-7 lg:h-8 rounded-lg bg-primary/20 flex items-center justify-center transition-transform hover:scale-110">
            <Container className="w-4 lg:w-5 h-4 lg:h-5 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-base lg:text-lg text-sidebar-foreground transition-opacity duration-300">
              Dock<span className="text-primary">Sphere</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 lg:py-4 px-2 space-y-0.5 lg:space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const linkContent = (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-2 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-sidebar-foreground/70'
              )}
            >
              <item.icon className="w-4 lg:w-5 h-4 lg:h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="transition-opacity duration-300 text-sm">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Settings & Collapse */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1',
                  pathname === '/settings'
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-sidebar-foreground/70'
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0 transition-transform hover:rotate-90" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Settings
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1',
              pathname === '/settings'
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-sidebar-foreground/70'
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0 transition-transform hover:rotate-90" />
            <span className="transition-opacity duration-300">Settings</span>
          </Link>
        )}

        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 w-full"
              >
                <ChevronRight className="w-5 h-5 transition-transform hover:translate-x-1" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Expand
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 w-full hover:translate-x-1"
          >
            <ChevronLeft className="w-5 h-5 transition-transform hover:-translate-x-1" />
            <span className="transition-opacity duration-300">Collapse</span>
          </button>
        )}
      </div>
    </aside>
  );
}
