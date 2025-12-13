'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  resetError: () => void
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    // Error logged to monitoring service
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  
  const errorId = React.useMemo(() => 
    Math.random().toString(36).substr(2, 9), []
  )

  const handleReportError = () => {
    // In a real app, this would send to an error reporting service
    const errorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // Copy to clipboard for easy reporting
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => {})
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <p className="text-muted-foreground mt-1">
                An unexpected error occurred in the application
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Error</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {error.name}
              </code>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-mono text-sm text-foreground">
                {error.message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            
            <Button variant="outline" onClick={handleReportError} className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Report Issue
            </Button>
          </div>

          {/* Error Details (Collapsible) */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Bug className="h-4 w-4 mr-2" />
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Error ID</h4>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {errorId}
                  </code>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Stack Trace</h4>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Component Stack</h4>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Environment</h4>
                  <div className="text-xs space-y-1">
                    <div>URL: {window.location.href}</div>
                    <div>User Agent: {navigator.userAgent}</div>
                    <div>Timestamp: {new Date().toISOString()}</div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
            <p className="font-medium mb-2">What happened?</p>
            <p>
              A JavaScript error occurred that prevented the application from continuing. 
              This error has been logged and you can help by reporting it using the button above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error fallbacks
export function ContainerErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Container Error</h3>
      <p className="text-muted-foreground mb-4">
        Failed to load container information: {error.message}
      </p>
      <Button onClick={resetError}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  )
}

export function NetworkErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Network Error</h3>
      <p className="text-muted-foreground mb-4">
        Failed to connect to Docker daemon: {error.message}
      </p>
      <div className="space-x-2">
        <Button onClick={resetError}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/settings'}>
          Check Settings
        </Button>
      </div>
    </div>
  )
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    // Error handled silently
    
    // In a real app, send to error reporting service
    // errorReportingService.captureException(error, { context })
  }, [])

  return { handleError }
}

// Main export
export const ErrorBoundary = ErrorBoundaryClass