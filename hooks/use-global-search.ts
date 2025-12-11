'use client';

import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@/contexts/SearchContext';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from './use-debounce';

interface SearchResult {
  id: string;
  name: string;
  type: 'container' | 'image' | 'network' | 'volume';
  status?: string;
  description?: string;
  path?: string;
}

export function useGlobalSearch() {
  const { 
    searchQuery, 
    setSearchResults, 
    isSearching, 
    setIsSearching,
    searchType 
  } = useSearch();

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch all data for searching
  const { data: containers = [] } = useQuery({
    queryKey: ['containers'],
    queryFn: () => apiClient.containers.list(),
    staleTime: 30000,
  });

  const { data: images = [] } = useQuery({
    queryKey: ['images'],
    queryFn: () => apiClient.images.list(false),
    staleTime: 30000,
  });

  const { data: networks = [] } = useQuery({
    queryKey: ['networks'],
    queryFn: () => apiClient.networks.list(),
    staleTime: 30000,
  });

  const { data: volumes = [] } = useQuery({
    queryKey: ['volumes'],
    queryFn: () => apiClient.volumes.list(),
    staleTime: 30000,
  });

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search containers
    if (searchType === 'all' || searchType === 'containers') {
      (containers as any[]).forEach((container: any) => {
        const name = container.names?.[0]?.replace('/', '') || 'unknown';
        const image = container.image || '';
        const id = container.id || '';
        
        if (
          name.toLowerCase().includes(lowerQuery) ||
          image.toLowerCase().includes(lowerQuery) ||
          id.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: container.id,
            name,
            type: 'container',
            status: container.state,
            description: `Image: ${image}`,
            path: `/containers/${container.id}`,
          });
        }
      });
    }

    // Search images
    if (searchType === 'all' || searchType === 'images') {
      (images as any[]).forEach((image: any) => {
        const tags = image.repoTags || [];
        const id = image.id || '';
        
        const matchesTags = tags.some((tag: string) => 
          tag.toLowerCase().includes(lowerQuery)
        );
        
        if (matchesTags || id.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: image.id,
            name: tags[0] || 'unnamed',
            type: 'image',
            description: `Size: ${Math.round((image.size || 0) / 1024 / 1024)}MB`,
            path: `/images/${image.id}`,
          });
        }
      });
    }

    // Search networks
    if (searchType === 'all' || searchType === 'networks') {
      (networks as any[]).forEach((network: any) => {
        const name = network.name || '';
        const id = network.id || '';
        
        if (
          name.toLowerCase().includes(lowerQuery) ||
          id.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: network.id,
            name,
            type: 'network',
            description: `Driver: ${network.driver || 'unknown'}`,
            path: `/networks/${network.id}`,
          });
        }
      });
    }

    // Search volumes
    if (searchType === 'all' || searchType === 'volumes') {
      (volumes as any[]).forEach((volume: any) => {
        const name = volume.name || '';
        
        if (name.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: volume.name,
            name,
            type: 'volume',
            description: `Driver: ${volume.driver || 'local'}`,
            path: `/volumes/${volume.name}`,
          });
        }
      });
    }

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery;
      const bExact = b.name.toLowerCase() === lowerQuery;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.name.localeCompare(b.name);
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setIsSearching(false);
  }, [containers, images, networks, volumes, searchType, setSearchResults, setIsSearching]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return {
    performSearch,
  };
}