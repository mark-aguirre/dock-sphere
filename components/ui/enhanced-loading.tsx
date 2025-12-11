import { cn } from "@/lib/utils"
import { Loader2, Container, Box, Network, HardDrive } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <Loader2 className={cn(
      "animate-spin text-muted-foreground",
      sizeClasses[size],
      className
    )} />
  )
}

interface PulsingDotsProps {
  className?: string
}

export function PulsingDots({ className }: PulsingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

interface BouncingDotsProps {
  className?: string
}

export function BouncingDots({ className }: BouncingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
    </div>
  )
}

interface ProgressBarProps {
  progress?: number
  indeterminate?: boolean
  className?: string
}

export function ProgressBar({ progress, indeterminate = false, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full bg-muted rounded-full h-2", className)}>
      <div 
        className={cn(
          "h-2 bg-primary rounded-full transition-all duration-300",
          indeterminate && "animate-pulse"
        )}
        style={{ 
          width: indeterminate ? '100%' : `${progress || 0}%`,
          ...(indeterminate && {
            background: 'linear-gradient(90deg, transparent, rgba(var(--primary), 0.5), transparent)',
            animation: 'shimmer 2s infinite'
          })
        }}
      />
    </div>
  )
}

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
}

export function TypewriterText({ text, speed = 50, className }: TypewriterTextProps) {
  const [displayText, setDisplayText] = React.useState('')
  
  React.useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)
    
    return () => clearInterval(timer)
  }, [text, speed])
  
  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

interface LoadingCardProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  progress?: number
  className?: string
}

export function LoadingCard({ 
  title, 
  description, 
  icon: Icon, 
  progress,
  className 
}: LoadingCardProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-6 space-y-4 animate-pulse shadow-sm",
      className
    )}>
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary animate-pulse" />
          </div>
        )}
        <div className="space-y-2 flex-1">
          <h3 className="font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <LoadingSpinner />
      </div>
      
      {progress !== undefined && (
        <ProgressBar progress={progress} />
      )}
    </div>
  )
}

interface ContextualLoadingProps {
  type: 'containers' | 'images' | 'networks' | 'volumes' | 'templates' | 'builds'
  message?: string
  progress?: number
  className?: string
}

export function ContextualLoading({ 
  type, 
  message, 
  progress,
  className 
}: ContextualLoadingProps) {
  const configs = {
    containers: {
      icon: Container,
      title: 'Loading Containers',
      defaultMessage: 'Fetching container information...'
    },
    images: {
      icon: Box,
      title: 'Loading Images',
      defaultMessage: 'Retrieving Docker images...'
    },
    networks: {
      icon: Network,
      title: 'Loading Networks',
      defaultMessage: 'Scanning network configurations...'
    },
    volumes: {
      icon: HardDrive,
      title: 'Loading Volumes',
      defaultMessage: 'Checking volume mounts...'
    },
    templates: {
      icon: Box,
      title: 'Loading Templates',
      defaultMessage: 'Loading application templates...'
    },
    builds: {
      icon: Box,
      title: 'Loading Builds',
      defaultMessage: 'Fetching build history...'
    }
  }
  
  const config = configs[type]
  
  return (
    <LoadingCard
      title={config.title}
      description={message || config.defaultMessage}
      icon={config.icon}
      progress={progress}
      className={className}
    />
  )
}

interface ShimmerProps {
  className?: string
  children?: React.ReactNode
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn(
      "relative overflow-hidden",
      className
    )}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

// Add shimmer keyframes to global CSS
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
`

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
  const style = document.createElement('style')
  style.id = 'shimmer-styles'
  style.textContent = shimmerKeyframes
  document.head.appendChild(style)
}

import React from "react"