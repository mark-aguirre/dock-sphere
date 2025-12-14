'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompactModeContextType {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined);

export const CompactModeProvider = ({ children }: { children: ReactNode }) => {
  const [isCompact, setIsCompact] = useState(true); // Fixed to laptop view (compact mode)
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize compact mode after hydration - always use laptop view
  useEffect(() => {
    // Always set to laptop view (compact mode)
    setIsCompact(true);
    setIsHydrated(true);
  }, []);

  // Remove auto-detection and resize handling since we're fixed to laptop view
  // useEffect(() => {
  //   if (!isHydrated) return;
  //   
  //   // Auto-detect screen size changes
  //   const handleResize = () => {
  //     const stored = localStorage.getItem('compact-mode');
  //     if (stored === null) { // Only auto-adjust if user hasn't manually set preference
  //       const isLaptopScreen = window.innerWidth <= 1440 && window.innerHeight <= 900;
  //       setIsCompact(isLaptopScreen);
  //     }
  //   };

  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    // Always store 'true' since we're fixed to laptop view
    localStorage.setItem('compact-mode', 'true');
    
    // Always add compact-mode class since we're fixed to laptop view
    document.documentElement.classList.add('compact-mode');
  }, [isHydrated]);

  // Create a no-op setIsCompact function since we're fixed to laptop view
  const fixedSetIsCompact = () => {
    // Do nothing - we're fixed to laptop view
  };

  return (
    <CompactModeContext.Provider value={{ isCompact, setIsCompact: fixedSetIsCompact }}>
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
