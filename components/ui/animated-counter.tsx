import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  format?: (value: number) => string
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className,
  format = (v) => v.toString()
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (displayValue === value) return

    setIsAnimating(true)
    const startValue = displayValue
    const difference = value - startValue
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentValue = Math.round(startValue + (difference * easeOut))
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue])

  return (
    <span 
      className={cn(
        "tabular-nums transition-all duration-200",
        isAnimating && "text-primary",
        className
      )}
    >
      {format(displayValue)}
    </span>
  )
}

// Specialized counters for common use cases
export function ContainerCounter({ count }: { count: number }) {
  return (
    <AnimatedCounter
      value={count}
      className="text-2xl font-bold"
      format={(v) => v.toLocaleString()}
    />
  )
}

export function PercentageCounter({ 
  percentage, 
  decimals = 1 
}: { 
  percentage: number
  decimals?: number 
}) {
  return (
    <AnimatedCounter
      value={percentage}
      className="text-lg font-semibold"
      format={(v) => `${v.toFixed(decimals)}%`}
    />
  )
}

export function BytesCounter({ bytes }: { bytes: number }) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <AnimatedCounter
      value={bytes}
      className="text-sm font-medium"
      format={formatBytes}
    />
  )
}