import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode
  className?: string
  overscan?: number
}

// Simple virtual list implementation (fallback without react-window)
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualListProps<T>) {
  const fixedHeight = typeof itemHeight === 'number' ? itemHeight : 60

  return (
    <div 
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      {items.map((item, index) => (
        <div key={index} style={{ height: fixedHeight }}>
          {renderItem({ 
            item, 
            index, 
            style: { height: fixedHeight } 
          })}
        </div>
      ))}
    </div>
  )
}

// Container list with simple scrolling
interface VirtualContainerListProps {
  containers: any[]
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onDelete: (id: string) => void
  className?: string
}

export function VirtualContainerList({
  containers,
  onStart,
  onStop,
  onRestart,
  onDelete,
  className
}: VirtualContainerListProps) {
  return (
    <div className={cn("border rounded-lg overflow-auto max-h-96", className)}>
      {containers.map((container, index) => (
        <div key={container.id} className="px-2 py-2 border-b last:border-b-0">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-mono">
                    {container.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{container.name}</h3>
                  <p className="text-sm text-muted-foreground">{container.image}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  container.status === 'running' && "bg-green-100 text-green-800",
                  container.status === 'stopped' && "bg-gray-100 text-gray-800",
                  container.status === 'paused' && "bg-yellow-100 text-yellow-800"
                )}>
                  {container.status}
                </span>
                
                <div className="flex space-x-1">
                  {container.status === 'stopped' && (
                    <button
                      onClick={() => onStart(container.id)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Start
                    </button>
                  )}
                  {container.status === 'running' && (
                    <button
                      onClick={() => onStop(container.id)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => onRestart(container.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Restart
                  </button>
                  <button
                    onClick={() => onDelete(container.id)}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Table with simple scrolling
interface VirtualTableProps<T> {
  data: T[]
  columns: Array<{
    key: string
    header: string
    render: (item: T) => React.ReactNode
    width?: number
  }>
  rowHeight?: number
  height?: number
  className?: string
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 60,
  height = 400,
  className
}: VirtualTableProps<T>) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="flex bg-muted/50 border-b">
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-3 font-medium text-sm flex-1"
            style={{ width: column.width }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Scrollable rows */}
      <div className="overflow-auto" style={{ height }}>
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex items-center border-b border-border/40 hover:bg-muted/50"
            style={{ minHeight: rowHeight }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="px-4 py-2 flex-1"
                style={{ width: column.width }}
              >
                {column.render(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Infinite scroll hook for pagination
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold = 100
) {
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    
    if (scrollHeight - scrollTop <= clientHeight + threshold && hasMore) {
      fetchMore()
    }
  }

  return { handleScroll }
}