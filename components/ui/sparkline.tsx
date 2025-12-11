'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showGradient?: boolean;
  animate?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'hsl(var(--primary))',
  showGradient = true,
  animate = true,
  className,
  strokeWidth = 2,
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (data.length === 0) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const gradientId = useMemo(() => {
    // Use a deterministic ID based on data to avoid hydration mismatch
    const dataHash = data.length > 0 ? data.reduce((acc, val) => acc + val, 0).toString(36) : 'empty';
    return `sparkline-gradient-${dataHash}-${width}-${height}`;
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className={cn('opacity-30', className)}
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="2,2"
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}

      {/* Gradient fill area */}
      {showGradient && (
        <path
          d={`${pathData} L ${width},${height} L 0,${height} Z`}
          fill={`url(#${gradientId})`}
          className={animate ? 'animate-in fade-in duration-500' : ''}
        />
      )}

      {/* Line path */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'animate-in fade-in duration-500' : ''}
        style={{
          vectorEffect: 'non-scaling-stroke',
        }}
      />
    </svg>
  );
}
