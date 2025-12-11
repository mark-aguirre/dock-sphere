'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompactModeContextType {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined);

export const CompactModeProvider = ({ children }: { children: ReactNode }) => {
  const [isCompact, setIsCompact] = useState(false); // Always start with false for SSR
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize compact mode after hydration
  useEffect(() => {
    const stored = localStorage.getItem('compact-mode');
    if (stored !== null) {
      setIsCompact(stored === 'true');
    } else {
      // Auto-detect laptop screens and enable compact mode by default
      const isLaptopScreen = window.innerWidth <= 1440 && window.innerHeight <= 900;
      setIsCompact(isLaptopScreen);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    // Auto-detect screen size changes
    const handleResize = () => {
      const stored = localStorage.getItem('compact-mode');
      if (stored === null) { // Only auto-adjust if user hasn't manually set preference
        const isLaptopScreen = window.innerWidth <= 1440 && window.innerHeight <= 900;
        setIsCompact(isLaptopScreen);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('compact-mode', String(isCompact));
    
    // Toggle class on root element for global CSS access
    if (isCompact) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [isCompact, isHydrated]);

  return (
    <CompactModeContext.Provider value={{ isCompact, setIsCompact }}>
      {children}
    </CompactModeContext.Provider>
  );
};

export const useCompactMode = () => {
  const context = useContext(CompactModeContext);
  if (!context) {
    throw new Error('useCompactMode must be used within a CompactModeProvider');
  }
  return context;
};
