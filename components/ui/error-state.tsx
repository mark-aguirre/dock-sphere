import { AlertTriangle, RefreshCw, Bug, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ErrorStateAction {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "secondary" | "destructive"
  loading?: boolean
}

interface ErrorStateProps {
  title: string
  description: string
  error?: Error | string
  errorCode?: string
  suggestions?: string[]
  actions?: ErrorStateAction[]
  className?: string
  variant?: "default" | "destructive"
  showDetails?: boolean
}

export function ErrorState({
  title,
  description,
  error,
  errorCode,
  suggestions = [],
  actions = [],
  className,
  variant = "destructive",
  showDetails = true
}: ErrorStateProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined

  return (
    <div className={cn("space-y-4", className)}>
      <Alert variant={variant} className="border-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {title}
          {errorCode && (
            <Badge variant="outline" className="text-xs">
              {errorCode}
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>{description}</p>
          
          {errorMessage && (
            <div className="rounded-md bg-muted/50 p-3 text-sm font-mono">
              {errorMessage}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Try these solutions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || (index === 0 ? "default" : "outline")}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.loading}
                >
                  {action.loading && (
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {showDetails && errorStack && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                >
                  <Bug className="mr-1 h-3 w-3" />
                  {showErrorDetails ? 'Hide' : 'Show'} technical details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-md bg-muted/30 p-3 text-xs font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{errorStack}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Specialized error states for common scenarios
export function DockerConnectionError({ onRetry, onCheckDocker }: {
  onRetry?: () => void
  onCheckDocker?: () => void
}) {
  return (
    <ErrorState
      title="Docker Connection Failed"
      description="Unable to connect to Docker daemon. Make sure Docker is running and accessible."
      errorCode="DOCKER_CONNECTION_ERROR"
      suggestions={[
        "Check if Docker Desktop is running",
        "Verify Docker daemon is accessible",
        "Check Docker socket permissions",
        "Restart Docker service if needed"
      ]}
      actions={[
        ...(onRetry ? [{
          label: "Retry Connection",
          onClick: onRetry,
          variant: "default" as const
        }] : []),
        ...(onCheckDocker ? [{
          label: "Check Docker Status",
          onClick: onCheckDocker,
          variant: "outline" as const
        }] : [])
      ]}
    />
  )
}

export function NetworkError({ onRetry }: {
  onRetry?: () => void
}) {
  return (
    <ErrorState
      title="Network Error"
      description="Failed to connect to the server. Please check your internet connection."
      errorCode="NETWORK_ERROR"
      suggestions={[
        "Check your internet connection",
        "Verify the server is running",
        "Try refreshing the page",
        "Check firewall settings"
      ]}
      actions={onRetry ? [{
        label: "Try Again",
        onClick: onRetry
      }] : []}
      variant="destructive"
    />
  )
}

export function PermissionError({ onRetry }: {
  onRetry?: () => void
}) {
  return (
    <ErrorState
      title="Permission Denied"
      description="You don't have permission to perform this action."
      errorCode="PERMISSION_ERROR"
      suggestions={[
        "Check if you're logged in",
        "Verify your account permissions",
        "Contact your administrator",
        "Try logging out and back in"
      ]}
      actions={onRetry ? [{
        label: "Retry",
        onClick: onRetry,
        variant: "outline"
      }] : []}
    />
  )
}

export function ValidationError({ 
  errors, 
  onRetry 
}: {
  errors: Record<string, string[]>
  onRetry?: () => void
}) {
  const errorList = Object.entries(errors).flatMap(([field, messages]) =>
    messages.map(message => `${field}: ${message}`)
  )

  return (
    <ErrorState
      title="Validation Failed"
      description="Please correct the following errors and try again."
      errorCode="VALIDATION_ERROR"
      suggestions={errorList}
      actions={onRetry ? [{
        label: "Try Again",
        onClick: onRetry
      }] : []}
      variant="destructive"
      showDetails={false}
    />
  )
}

export function UnknownError({ 
  error, 
  onRetry, 
  onReport 
}: {
  error: Error
  onRetry?: () => void
  onReport?: () => void
}) {
  return (
    <ErrorState
      title="Something went wrong"
      description="An unexpected error occurred. This has been logged for investigation."
      error={error}
      errorCode="UNKNOWN_ERROR"
      suggestions={[
        "Try refreshing the page",
        "Check if the issue persists",
        "Report this error if it continues",
        "Try again in a few minutes"
      ]}
      actions={[
        ...(onRetry ? [{
          label: "Try Again",
          onClick: onRetry
        }] : []),
        ...(onReport ? [{
          label: "Report Issue",
          onClick: onReport,
          variant: "outline" as const
        }] : [])
      ]}
    />
  )
}