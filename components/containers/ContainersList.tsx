import { Container } from '@/types/docker';
import { ContainerCard } from './ContainerCard';
import { ContainersTable } from './ContainersTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCompactMode } from '@/contexts/CompactModeContext';

interface ContainersListProps {
  containers: Container[];
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onRestart?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
  loading?: boolean;
}

type SortField = 'name' | 'status' | 'image' | 'created';
type SortOrder = 'asc' | 'desc';

export function ContainersList({
  containers,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onCreate,
  loading = false,
}: ContainersListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const { isCompact } = useCompactMode();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredContainers = containers.filter((container) => {
    const matchesSearch =
      container.name.toLowerCase().includes(search.toLowerCase()) ||
      container.image.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || container.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedContainers = [...filteredContainers].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'image':
        comparison = a.image.localeCompare(b.image);
        break;
      case 'created':
        comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search containers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="created">Created</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown className={cn('w-3.5 h-3.5', sortOrder === 'desc' && 'rotate-180')} />
        </Button>

        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', viewMode === 'grid' && 'bg-background shadow-sm')}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', viewMode === 'list' && 'bg-background shadow-sm')}
            onClick={() => setViewMode('list')}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button className="ml-auto h-9 text-sm" onClick={onCreate}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground text-sm">Loading containers...</p>
        </div>
      ) : filteredContainers.length === 0 ? (
        <div className="text-center py-8 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground text-sm">No containers found</p>
        </div>
      ) : viewMode === 'list' ? (
        <ContainersTable
          containers={sortedContainers}
          onStart={onStart}
          onStop={onStop}
          onRestart={onRestart}
          onDelete={onDelete}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onStart={onStart}
              onStop={onStop}
              onRestart={onRestart}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
