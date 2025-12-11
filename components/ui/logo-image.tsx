'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Container } from 'lucide-react';

interface LogoImageProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoImage({ size = 'md', className = '' }: LogoImageProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  const sizePixels = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 }
  };

  if (imageError) {
    return (
      <Container 
        className={`${sizeClasses[size]} text-primary-foreground ${className}`} 
      />
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="DockSphere"
      width={sizePixels[size].width}
      height={sizePixels[size].height}
      className={`${sizeClasses[size]} ${className}`}
      onError={() => setImageError(true)}
      priority
    />
  );
}