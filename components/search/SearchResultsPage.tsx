'use client';

import { useSearch } from '@/contexts/SearchContext';
import { Container, Box, Network, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

export function SearchResultsPage() {
  const { searchQuery, searchResults } = useSearch();

  if (!searchQuery) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Enter a search query to see results</p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">No results found</p>
        <p className="text-muted-foreground mt-2">
          No containers, images, networks, or volumes match "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search Results</h1>
        <p className="text-muted-foreground">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      </div>

      <div className="grid gap-4">
        {searchResults.map((result) => {
          const Icon = typeIcons[result.type];
          return (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.path || '#'}
              className="bg-card border border-border rounded-lg p-4 block hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-lg bg-muted/50",
                  typeColors[result.type]
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{result.name}</h3>
                    <span className="text-sm px-2 py-1 bg-muted rounded capitalize">
                      {result.type}
                    </span>
                    {result.status && (
                      <span className={cn(
                        "text-sm px-2 py-1 rounded",
                        result.status === 'running' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      )}>
                        {result.status}
                      </span>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-muted-foreground">{result.description}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}