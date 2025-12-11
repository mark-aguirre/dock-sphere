'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/ui/loading-button';
import { ListSkeleton } from '@/components/ui/skeleton-loader';
import { NoImagesState, SearchEmptyState } from '@/components/ui/empty-state';
import { DockerConnectionError, NetworkError } from '@/components/ui/error-state';
import { TextField } from '@/components/ui/form-field';
import { Search, Download, Trash2, Plus, Box, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

type SortField = 'name' | 'size' | 'created';
type SortOrder = 'asc' | 'desc';

export default function ImagesPage() {
  const [search, setSearch] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [pullImageName, setPullImageName] = useState('');
  const [pullTag, setPullTag] = useState('latest');
  const [pulling, setPulling] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await apiClient.images.list(false);
      setImages(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch images');
      toast({
        title: 'Error loading images',
        description: error.message || 'Failed to fetch images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-3 h-3 ml-1" /> : 
      <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filteredImages = images
    .filter((image) => {
      const repoTags = image.repoTags.join(' ').toLowerCase();
      return repoTags.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          const nameA = a.repoTags[0] || '';
          const nameB = b.repoTags[0] || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'created':
          comparison = a.created - b.created;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handlePull = async () => {
    if (!pullImageName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image name",
        variant: "destructive",
      });
      return;
    }

    try {
      setPulling(true);
      await apiClient.images.pull(pullImageName, pullTag);
      toast({
        title: "Image Pulled",
        description: `Successfully pulled ${pullImageName}:${pullTag}`,
      });
      setPullDialogOpen(false);
      setPullImageName('');
      setPullTag('latest');
      fetchImages();
    } catch (error: any) {
      toast({
        title: "Error pulling image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPulling(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setImageToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      setDeleting(true);
      await apiClient.images.remove(imageToDelete.id);
      toast({
        title: "Image Deleted",
        description: `${imageToDelete.name} has been removed.`,
      });
      fetchImages();
    } catch (error: any) {
      toast({
        title: "Error deleting image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Images" description="Manage your Docker images">
        <ListSkeleton rows={6} columns={5} />
      </AppLayout>
    );
  }

  if (error) {
    const isDockerError = error.includes('Docker') || error.includes('daemon');
    const isNetworkError = error.includes('network') || error.includes('connection');
    
    return (
      <AppLayout title="Images" description="Manage your Docker images">
        {isDockerError ? (
          <DockerConnectionError onRetry={fetchImages} />
        ) : isNetworkError ? (
          <NetworkError onRetry={fetchImages} />
        ) : (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Images" description="Manage your Docker images">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {!pullDialogOpen ? (
            <Button onClick={() => setPullDialogOpen(true)} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Pull Image
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <TextField
                label=""
                placeholder="Image name (e.g., nginx)"
                value={pullImageName}
                onChange={setPullImageName}
                className="w-48"
              />
              <TextField
                label=""
                placeholder="Tag"
                value={pullTag}
                onChange={setPullTag}
                className="w-24"
              />
              <LoadingButton 
                onClick={handlePull} 
                loading={pulling}
                loadingText="Pulling..."
              >
                Pull
              </LoadingButton>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPullDialogOpen(false);
                  setPullImageName('');
                  setPullTag('latest');
                }}
                disabled={pulling}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {images.length === 0 ? (
          search ? (
            <SearchEmptyState 
              query={search} 
              onClearSearch={() => setSearch('')} 
            />
          ) : (
            <NoImagesState onPullImage={() => setPullDialogOpen(true)} />
          )
        ) : filteredImages.length === 0 ? (
          <SearchEmptyState 
            query={search} 
            onClearSearch={() => setSearch('')} 
          />
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground text-xs h-9">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Repository:Tag
                      {getSortIcon('name')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs h-9">Image ID</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-9">
                    <button
                      onClick={() => handleSort('size')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Size
                      {getSortIcon('size')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs h-9">
                    <button
                      onClick={() => handleSort('created')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Created
                      {getSortIcon('created')}
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right h-9">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                filteredImages.map((image) => {
                    const repoTag = image.repoTags[0] || '<none>:<none>';
                    const [repository, tag] = repoTag.split(':');
                    
                    return (
                      <TableRow key={image.id} className="border-border hover:bg-muted/50">
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-primary" />
                            <span className="font-medium text-sm">{repository}</span>
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                            {image.containers > 0 && (
                              <Badge className="bg-status-running/10 text-status-running border-0 text-[10px] h-4 px-1.5">
                                In Use ({image.containers})
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground py-2">
                          {image.id.replace('sha256:', '').slice(0, 12)}
                        </TableCell>
                        <TableCell className="font-mono text-xs py-2">
                          {formatBytes(image.size)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">
                          {formatDate(image.created)}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-7 w-7"
                              onClick={() => handleDeleteClick(image.id, repoTag)}
                              disabled={image.containers > 0}
                              title={image.containers > 0 ? 'Image is in use by containers' : 'Delete image'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                }
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-mono font-semibold">{imageToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <LoadingButton
              onClick={handleDeleteConfirm}
              loading={deleting}
              loadingText="Deleting..."
              variant="destructive"
            >
              Delete
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
