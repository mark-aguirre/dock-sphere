'use client';

import { Container } from '@/types/docker';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Play, Square, RotateCcw, Trash2, Terminal, MoreVertical, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'status' | 'image' | 'created';
type SortOrder = 'asc' | 'desc';

interface ContainersTableProps {
  containers: Container[];
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onRestart?: (id: string) => void;
  onDelete?: (id: string) => void;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}

export function ContainersTable({
  containers,
  onStart,
  onStop,
  onRestart,
  onDelete,
  sortField,
  sortOrder,
  onSort,
}: ContainersTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className={cn(
          "text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors",
          isActive && "text-foreground"
        )}
        onClick={() => onSort?.(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && (
            sortOrder === 'asc' ? 
              <ArrowUp className="w-3.5 h-3.5" /> : 
              <ArrowDown className="w-3.5 h-3.5" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-muted-foreground w-12">
              <input type="checkbox" className="rounded" />
            </TableHead>
            <SortableHeader field="name">Name</SortableHeader>
            <SortableHeader field="status">State</SortableHeader>
            <TableHead className="text-muted-foreground">Quick Actions</TableHead>
            <SortableHeader field="image">Image</SortableHeader>
            <SortableHeader field="created">Created</SortableHeader>
            <TableHead className="text-muted-foreground">IP Address</TableHead>
            <TableHead className="text-muted-foreground">Published Ports</TableHead>
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No containers found
              </TableCell>
            </TableRow>
          ) : (
            containers.map((container) => (
              <TableRow key={container.id} className="border-border hover:bg-muted/50">
                <TableCell>
                  <input type="checkbox" className="rounded" />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/containers/${container.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-2 transition-colors"
                  >
                    {container.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={container.status} size="sm" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {container.status === 'running' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onStop?.(container.id)}
                          title="Stop"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRestart?.(container.id)}
                          title="Restart"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Shell"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-status-running"
                        onClick={() => onStart?.(container.id)}
                        title="Start"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {container.image}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(container.created)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {container.networks.length > 0 ? container.networks[0] : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {container.ports.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {container.ports.slice(0, 2).map((port, i) => (
                        <a
                          key={i}
                          href={`http://localhost:${port.hostPort}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {port.hostPort}:{port.containerPort}
                        </a>
                      ))}
                      {container.ports.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{container.ports.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/containers/${container.id}`} className="cursor-pointer">
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Terminal className="w-4 h-4 mr-2" />
                        Open Shell
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        View Logs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {container.status === 'running' ? (
                        <>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onStop?.(container.id)}
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Stop
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onRestart?.(container.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restart
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onStart?.(container.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onClick={() => onDelete?.(container.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
