'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/contexts/SearchContext';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { SearchDropdown } from './SearchDropdown';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { searchQuery, setSearchQuery } = useSearch();
  useGlobalSearch(); // This handles the search logic

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        setIsFocused(true);
      }
      
      // Escape to close search
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (searchQuery.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-48 lg:w-64 group">
      <Search className={cn(
        "absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 w-3.5 lg:w-4 h-3.5 lg:h-4 transition-colors",
        isFocused ? "text-primary" : "text-muted-foreground"
      )} />
      
      <Input
        ref={inputRef}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder="Search containers, images..."
        className={cn(
          "pl-8 lg:pl-9 text-sm bg-background/50 border-border/50 transition-all h-8 lg:h-10",
          "focus:border-primary/50 focus:bg-background/80",
          searchQuery && "pr-8"
        )}
      />
      
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 lg:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
        </button>
      )}

      {/* Keyboard shortcut hint */}
      {!isFocused && !searchQuery && (
        <div className="absolute right-2.5 lg:right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">
          ⌘K
        </div>
      )}

      <SearchDropdown 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
}