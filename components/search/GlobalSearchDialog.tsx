'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Container, Box, Network, HardDrive, Package, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'container' | 'image' | 'network' | 'volume' | 'template' | 'build' | 'command'
  url: string
  icon: React.ComponentType<{ className?: string }>
  status?: string
  metadata?: Record<string, any>
}

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Fetch all searchable data
  const { data: containers = [] } = useQuery({
    queryKey: ['containers'],
    queryFn: () => apiClient.containers.list(),
    enabled: open
  })

  const { data: images = [] } = useQuery({
    queryKey: ['images'],
    queryFn: () => apiClient.images.list(),
    enabled: open
  })

  const { data: networks = [] } = useQuery({
    queryKey: ['networks'],
    queryFn: () => apiClient.networks.list(),
    enabled: open
  })

  const { data: volumes = [] } = useQuery({
    queryKey: ['volumes'],
    queryFn: () => apiClient.volumes.list(),
    enabled: open
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.templates.list(),
    enabled: open
  })

  // Transform data into search results
  const allResults = useMemo(() => {
    const results: SearchResult[] = []

    // Containers
    if (Array.isArray(containers)) {
      containers.forEach((container: any) => {
        results.push({
          id: container.id,
          title: container.names?.[0]?.replace('/', '') || container.id.slice(0, 12),
          subtitle: container.image,
          type: 'container',
          url: `/containers/${container.id}`,
          icon: Container,
          status: container.state,
          metadata: { ports: container.ports, created: container.created }
        })
      })
    }

    // Images
    if (Array.isArray(images)) {
      images.forEach((image: any) => {
        const repoTags = image.repoTags || ['<none>:<none>']
        repoTags.forEach((tag: string) => {
          results.push({
            id: `${image.id}-${tag}`,
            title: tag,
            subtitle: `${(image.size / 1024 / 1024).toFixed(1)} MB`,
            type: 'image',
            url: '/images',
            icon: Box,
            metadata: { size: image.size, created: image.created }
          })
        })
      })
    }

    // Networks
    if (Array.isArray(networks)) {
      networks.forEach((network: any) => {
        results.push({
          id: network.id,
          title: network.name,
          subtitle: `${network.driver} network`,
          type: 'network',
          url: '/networks',
          icon: Network,
          metadata: { driver: network.driver, scope: network.scope }
        })
      })
    }

    // Volumes
    if (Array.isArray(volumes)) {
      volumes.forEach((volume: any) => {
        results.push({
          id: volume.name,
          title: volume.name,
          subtitle: volume.driver,
          type: 'volume',
          url: '/volumes',
          icon: HardDrive,
          metadata: { driver: volume.driver, mountpoint: volume.mountpoint }
        })
      })
    }

    // Templates
    if (Array.isArray(templates)) {
      templates.forEach((template: any) => {
        results.push({
          id: template.id,
          title: template.name,
          subtitle: template.description,
          type: 'template',
          url: '/templates',
          icon: Package,
          metadata: { category: template.category }
        })
      })
    }

    return results
  }, [containers, images, networks, volumes, templates])

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 20) // Show recent items

    const searchTerm = query.toLowerCase()
    return allResults.filter(result => 
      result.title.toLowerCase().includes(searchTerm) ||
      result.subtitle.toLowerCase().includes(searchTerm) ||
      result.type.includes(searchTerm)
    ).slice(0, 50)
  }, [query, allResults])



  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredResults[selectedIndex]) {
            handleSelect(filteredResults[selectedIndex])
          }
          break
        case 'Escape':
          onOpenChange(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredResults, selectedIndex, onOpenChange])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false)
    router.push(result.url)
    setQuery('')
  }

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-background/95 backdrop-blur-sm border-muted">
        <div className="p-4 pr-12 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search containers, images, networks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-8 border-0 bg-transparent focus-visible:ring-0 text-base"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-muted/50 mx-4" />

        <ScrollArea className="max-h-80 p-4 pt-2">
          {filteredResults.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((result, index) => {
                const Icon = result.icon
                
                return (
                  <div
                    key={result.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                      index === selectedIndex 
                        ? "bg-muted/50" 
                        : "hover:bg-muted/30"
                    )}
                    onClick={() => handleSelect(result)}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <span className="text-xs text-muted-foreground">{result.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}