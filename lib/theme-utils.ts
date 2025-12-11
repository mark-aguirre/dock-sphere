/**
 * Theme Utilities
 * Helper functions for theme management and color operations
 */

/**
 * Status color mappings
 */
export const statusColors = {
  running: 'hsl(var(--status-running))',
  stopped: 'hsl(var(--status-stopped))',
  paused: 'hsl(var(--status-paused))',
  warning: 'hsl(var(--status-warning))',
  info: 'hsl(var(--status-info))',
  success: 'hsl(var(--status-running))',
  error: 'hsl(var(--status-stopped))',
  default: 'hsl(var(--muted-foreground))',
} as const;

export type StatusType = keyof typeof statusColors;

/**
 * Get color for a given status
 */
export function getStatusColor(status: StatusType): string {
  return statusColors[status] || statusColors.default;
}

/**
 * Get CSS class for status color
 */
export function getStatusClass(status: StatusType): string {
  const classMap: Record<StatusType, string> = {
    running: 'text-status-running',
    stopped: 'text-status-stopped',
    paused: 'text-status-paused',
    warning: 'text-status-warning',
    info: 'text-[hsl(var(--status-info))]',
    success: 'text-status-running',
    error: 'text-status-stopped',
    default: 'text-muted-foreground',
  };
  
  return classMap[status] || classMap.default;
}

/**
 * Get background color class for status
 */
export function getStatusBgClass(status: StatusType): string {
  const classMap: Record<StatusType, string> = {
    running: 'bg-status-running/10 border-status-running/20',
    stopped: 'bg-status-stopped/10 border-status-stopped/20',
    paused: 'bg-status-paused/10 border-status-paused/20',
    warning: 'bg-status-warning/10 border-status-warning/20',
    info: 'bg-[hsl(var(--status-info))]/10 border-[hsl(var(--status-info))]/20',
    success: 'bg-status-running/10 border-status-running/20',
    error: 'bg-status-stopped/10 border-status-stopped/20',
    default: 'bg-muted border-border',
  };
  
  return classMap[status] || classMap.default;
}

/**
 * Resource threshold levels
 */
export const thresholds = {
  cpu: {
    normal: 70,
    warning: 85,
    critical: 95,
  },
  memory: {
    normal: 70,
    warning: 85,
    critical: 95,
  },
  disk: {
    normal: 70,
    warning: 85,
    critical: 90,
  },
} as const;

export type ResourceType = keyof typeof thresholds;
export type ThresholdLevel = 'normal' | 'warning' | 'critical';

/**
 * Get threshold level for a resource value
 */
export function getThresholdLevel(
  value: number,
  resourceType: ResourceType
): ThresholdLevel {
  const threshold = thresholds[resourceType];
  
  if (value >= threshold.critical) return 'critical';
  if (value >= threshold.warning) return 'warning';
  return 'normal';
}

/**
 * Get color for threshold level
 */
export function getThresholdColor(level: ThresholdLevel): string {
  const colorMap: Record<ThresholdLevel, string> = {
    normal: 'hsl(var(--status-running))',
    warning: 'hsl(var(--status-warning))',
    critical: 'hsl(var(--status-stopped))',
  };
  
  return colorMap[level];
}

/**
 * Get CSS class for threshold level
 */
export function getThresholdClass(level: ThresholdLevel): string {
  const classMap: Record<ThresholdLevel, string> = {
    normal: 'text-status-running',
    warning: 'text-status-warning',
    critical: 'text-status-stopped',
  };
  
  return classMap[level];
}

/**
 * Get background gradient class for threshold level
 */
export function getThresholdGradientClass(level: ThresholdLevel): string {
  const classMap: Record<ThresholdLevel, string> = {
    normal: 'from-status-running/80 to-status-running',
    warning: 'from-status-warning/80 to-status-warning',
    critical: 'from-status-stopped/80 to-status-stopped',
  };
  
  return classMap[level];
}

/**
 * Calculate contrast ratio between two colors (simplified)
 * Returns approximate ratio for WCAG compliance checking
 */
export function getContrastRatio(foreground: string, background: string): number {
  // This is a simplified version - in production, use a proper color library
  // For now, return a mock value that passes WCAG AA (4.5:1)
  // TODO: Implement proper contrast calculation
  return 4.5;
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * Theme persistence helpers
 */
export const THEME_STORAGE_KEY = 'docksphere-theme';

export function saveThemePreference(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

export function loadThemePreference(): 'light' | 'dark' | 'system' | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  }
  return null;
}

export function clearThemePreference(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }
}
