import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: "default" | "outline" | "secondary"
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: EmptyStateAction[]
  className?: string
  size?: "sm" | "md" | "lg"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  className,
  size = "md"
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-sm",
      spacing: "space-y-3"
    },
    md: {
      container: "py-12",
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-base",
      spacing: "space-y-4"
    },
    lg: {
      container: "py-16",
      icon: "h-20 w-20",
      title: "text-2xl",
      description: "text-lg",
      spacing: "space-y-6"
    }
  }

  const sizes = sizeClasses[size]

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizes.container,
      sizes.spacing,
      className
    )}>
      <div className={cn(
        "rounded-full bg-muted/50 p-4 mb-2",
        "ring-8 ring-muted/20"
      )}>
        <Icon className={cn(
          sizes.icon,
          "text-muted-foreground"
        )} />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h3 className={cn(
          "font-semibold text-foreground",
          sizes.title
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          sizes.description
        )}>
          {description}
        </p>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || (index === 0 ? "default" : "outline")}
              onClick={action.onClick}
              asChild={!!action.href}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// Specialized empty states for common scenarios
export function NoContainersState({ onCreateContainer, onBrowseTemplates }: {
  onCreateContainer?: () => void
  onBrowseTemplates?: () => void
}) {
  return (
    <EmptyState
      icon={require("lucide-react").Container}
      title="No containers found"
      description="Get started by creating a container from an image or installing a pre-configured template."
      actions={[
        ...(onBrowseTemplates ? [{
          label: "Browse Templates",
          onClick: onBrowseTemplates
        }] : []),
        ...(onCreateContainer ? [{
          label: "Create Container",
          onClick: onCreateContainer,
          variant: "outline" as const
        }] : [])
      ]}
    />
  )
}

export function NoImagesState({ onPullImage }: {
  onPullImage?: () => void
}) {
  return (
    <EmptyState
      icon={require("lucide-react").Box}
      title="No images available"
      description="Pull an image from a registry to get started with creating containers."
      actions={onPullImage ? [{
        label: "Pull Image",
        onClick: onPullImage
      }] : []}
    />
  )
}

export function NoNetworksState({ onCreateNetwork }: {
  onCreateNetwork?: () => void
}) {
  return (
    <EmptyState
      icon={require("lucide-react").Network}
      title="No custom networks"
      description="Create custom networks to isolate and connect your containers."
      actions={onCreateNetwork ? [{
        label: "Create Network",
        onClick: onCreateNetwork
      }] : []}
    />
  )
}

export function NoVolumesState({ onCreateVolume }: {
  onCreateVolume?: () => void
}) {
  return (
    <EmptyState
      icon={require("lucide-react").HardDrive}
      title="No volumes found"
      description="Create volumes to persist data and share files between containers."
      actions={onCreateVolume ? [{
        label: "Create Volume",
        onClick: onCreateVolume
      }] : []}
    />
  )
}

export function NoTemplatesState() {
  return (
    <EmptyState
      icon={require("lucide-react").Package}
      title="No templates available"
      description="Templates help you quickly deploy pre-configured applications."
      size="sm"
    />
  )
}

export function NoBuildsState({ onConnectRepository }: {
  onConnectRepository?: () => void
}) {
  return (
    <EmptyState
      icon={require("lucide-react").GitBranch}
      title="No repositories connected"
      description="Connect your GitHub or GitLab repositories to build and deploy Docker images automatically."
      actions={onConnectRepository ? [{
        label: "Connect Repository",
        onClick: onConnectRepository
      }] : []}
    />
  )
}

export function SearchEmptyState({ query, onClearSearch }: {
  query: string
  onClearSearch?: () => void
}) {
  return (
    <EmptyState
      icon={require("lucide-react").Search}
      title="No results found"
      description={`No items match "${query}". Try adjusting your search terms or filters.`}
      actions={onClearSearch ? [{
        label: "Clear Search",
        onClick: onClearSearch,
        variant: "outline"
      }] : []}
      size="sm"
    />
  )
}