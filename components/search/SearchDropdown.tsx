'use client';

import { useSearch } from '@/contexts/SearchContext';
import { cn } from '@/lib/utils';
import { Container, Box, Network, HardDrive, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const typeIcons = {
  container: Container,
  image: Box,
  network: Network,
  volume: HardDrive,
};

const typeColors = {
  container: 'text-blue-500',
  image: 'text-green-500',
  network: 'text-purple-500',
  volume: 'text-orange-500',
};

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  const { searchQuery, searchResults, isSearching } = useSearch();
  const router = useRouter();

  if (!isOpen) return null;

  const handleResultClick = (path?: string) => {
    onClose();
    if (path) {
      router.push(path);
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
      {isSearching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      ) : searchQuery && searchResults.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try searching for containers, images, networks, or volumes
          </p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="py-2">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
          {searchResults.map((result) => {
            const Icon = typeIcons[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result.path)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className={cn(
                  "p-1.5 rounded-md bg-muted/50",
                  typeColors[result.type]
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{result.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded capitalize">
                      {result.type}
                    </span>
                    {result.status && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        result.status === 'running' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      )}>
                        {result.status}
                      </span>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {result.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}