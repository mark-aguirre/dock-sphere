'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompactModeProvider } from '@/contexts/CompactModeContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ThemeProvider } from 'next-themes';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { useState } from 'react';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <title>DockSphere - Docker Container Management</title>
        <meta name="description" content="Modern Docker container management interface with real-time monitoring and control" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryClientProvider client={queryClient}>
              <SidebarProvider>
                <CompactModeProvider>
                  <SearchProvider>
                    <TooltipProvider>
                      <ErrorBoundary>
                        {children}
                      </ErrorBoundary>
                      <Toaster />
                      <Sonner />
                    </TooltipProvider>
                  </SearchProvider>
                </CompactModeProvider>
              </SidebarProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
