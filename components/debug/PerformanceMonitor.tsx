'use client'

import { useState, useEffect } from 'react'
import { Activity, Clock, Zap, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface PerformanceMetrics {
  // Web Vitals
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  
  // Runtime metrics
  memoryUsage?: number
  jsHeapSize?: number
  domNodes?: number
  
  // Network
  connectionType?: string
  downlink?: number
  
  // Custom metrics
  apiResponseTime?: number
  renderTime?: number
}

interface PerformanceMonitorProps {
  className?: string
}

export function PerformanceMonitor({ className }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    setIsVisible(true)
    
    // Collect Web Vitals
    const collectWebVitals = async () => {
      try {
        const webVitals = await import('web-vitals')
        
        if (webVitals.onCLS) {
          webVitals.onCLS((metric) => {
            setMetrics(prev => ({ ...prev, cls: metric.value }))
          })
        }
        
        if (webVitals.onINP) {
          webVitals.onINP((metric) => {
            setMetrics(prev => ({ ...prev, fid: metric.value }))
          })
        }
        
        if (webVitals.onFCP) {
          webVitals.onFCP((metric) => {
            setMetrics(prev => ({ ...prev, fcp: metric.value }))
          })
        }
        
        if (webVitals.onLCP) {
          webVitals.onLCP((metric) => {
            setMetrics(prev => ({ ...prev, lcp: metric.value }))
          })
        }
        
        if (webVitals.onTTFB) {
          webVitals.onTTFB((metric) => {
            setMetrics(prev => ({ ...prev, ttfb: metric.value }))
          })
        }
      } catch (error) {
        console.warn('Web Vitals not available:', error)
      }
    }

    // Collect runtime metrics
    const collectRuntimeMetrics = () => {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
          jsHeapSize: memory.totalJSHeapSize / 1024 / 1024 // MB
        }))
      }

      // DOM nodes
      const domNodes = document.querySelectorAll('*').length
      setMetrics(prev => ({ ...prev, domNodes }))

      // Network info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType,
          downlink: connection.downlink
        }))
      }
    }

    // Initial collection
    collectWebVitals()
    collectRuntimeMetrics()

    // Update runtime metrics periodically
    const interval = setInterval(collectRuntimeMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  const getScoreColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'Good'
    if (value <= thresholds.poor) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 w-80 z-50 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
          <Badge variant="outline" className="text-xs">DEV</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 text-xs">
        {/* Web Vitals */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Web Vitals
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {metrics.lcp && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>LCP</span>
                  <span className={getScoreColor(metrics.lcp, { good: 2500, poor: 4000 })}>
                    {metrics.lcp.toFixed(0)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min((metrics.lcp / 4000) * 100, 100)} 
                  className="h-1"
                />
              </div>
            )}
            
            {metrics.fid && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>FID</span>
                  <span className={getScoreColor(metrics.fid, { good: 100, poor: 300 })}>
                    {metrics.fid.toFixed(0)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min((metrics.fid / 300) * 100, 100)} 
                  className="h-1"
                />
              </div>
            )}
            
            {metrics.cls && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>CLS</span>
                  <span className={getScoreColor(metrics.cls, { good: 0.1, poor: 0.25 })}>
                    {metrics.cls.toFixed(3)}
                  </span>
                </div>
                <Progress 
                  value={Math.min((metrics.cls / 0.25) * 100, 100)} 
                  className="h-1"
                />
              </div>
            )}
            
            {metrics.ttfb && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>TTFB</span>
                  <span className={getScoreColor(metrics.ttfb, { good: 800, poor: 1800 })}>
                    {metrics.ttfb.toFixed(0)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min((metrics.ttfb / 1800) * 100, 100)} 
                  className="h-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Runtime Metrics */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-1">
            <Database className="h-3 w-3" />
            Runtime
          </h4>
          <div className="space-y-2">
            {metrics.memoryUsage && (
              <div className="flex justify-between">
                <span>Memory Usage</span>
                <span>{metrics.memoryUsage.toFixed(1)} MB</span>
              </div>
            )}
            
            {metrics.domNodes && (
              <div className="flex justify-between">
                <span>DOM Nodes</span>
                <span>{metrics.domNodes.toLocaleString()}</span>
              </div>
            )}
            
            {metrics.connectionType && (
              <div className="flex justify-between">
                <span>Connection</span>
                <span>{metrics.connectionType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Score */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Score</span>
            <Badge 
              variant={
                metrics.lcp && metrics.lcp <= 2500 && 
                metrics.fid && metrics.fid <= 100 && 
                metrics.cls && metrics.cls <= 0.1 
                  ? 'default' 
                  : 'secondary'
              }
            >
              {metrics.lcp && metrics.fid && metrics.cls
                ? metrics.lcp <= 2500 && metrics.fid <= 100 && metrics.cls <= 0.1
                  ? 'Good'
                  : 'Needs Work'
                : 'Loading...'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for tracking custom performance metrics
export function usePerformanceTracking() {
  const trackApiCall = (endpoint: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Call: ${endpoint} took ${duration}ms`)
    }
  }

  const trackRender = (component: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Render: ${component} took ${duration}ms`)
    }
  }

  const trackUserInteraction = (action: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`User Action: ${action} took ${duration}ms`)
    }
  }

  return {
    trackApiCall,
    trackRender,
    trackUserInteraction
  }
}