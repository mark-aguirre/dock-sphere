'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { TextField, SelectField } from '@/components/ui/form-field';
import { NoTemplatesState, SearchEmptyState } from '@/components/ui/empty-state';
import { TemplateCardSkeleton } from '@/components/ui/skeleton-loader';
import { DockerConnectionError, NetworkError } from '@/components/ui/error-state';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppTemplate } from '@/types/docker';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: any = await apiClient.templates.list();
        setTemplates(data);
      } catch (error: any) {
        setError(error.message || 'Failed to fetch templates');
        toast({
          title: 'Error loading templates',
          description: error.message || 'Failed to fetch templates',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  const categories = ['all', ...new Set(templates.map((t) => t.category))];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || template.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleDeploy = async (template: any) => {
    setSelectedTemplate(template);
    
    // Initialize form data with default values
    const initialData: Record<string, any> = {};
    template.requiredConfig?.forEach((field: any) => {
      initialData[field.name] = field.defaultValue || '';
    });
    
    // Add environment variables
    template.defaultEnv?.forEach((env: any) => {
      initialData[env.name] = env.value || '';
    });
    
    setFormData(initialData);
    setDeployDialogOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Container name is required';
    }
    
    selectedTemplate?.requiredConfig?.forEach((field: any) => {
      if (field.required && !formData[field.name]?.toString().trim()) {
        errors[field.name] = `${field.label} is required`;
      }
    });
    
    selectedTemplate?.defaultEnv?.forEach((env: any) => {
      if (env.required && !formData[env.name]?.toString().trim()) {
        errors[env.name] = `${env.name} is required`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeploySubmit = async () => {
    if (!selectedTemplate || !validateForm()) return;

    try {
      setDeploying(true);

      // Prepare installation config
      const config: any = {
        name: formData.name || selectedTemplate.id,
        environment: {},
      };

      // Add environment variables
      selectedTemplate.defaultEnv?.forEach((env: any) => {
        if (formData[env.name]) {
          config.environment[env.name] = formData[env.name];
        }
      });

      // Install the template
      const result = await apiClient.templates.install(selectedTemplate.id, config);

      toast({
        title: 'Template Deployed',
        description: `${selectedTemplate.name} has been deployed successfully!`,
      });

      setDeployDialogOpen(false);
      setSelectedTemplate(null);
      setFormData({});
      setFormErrors({});

      // Redirect to containers page
      router.push('/containers');
    } catch (error: any) {
      toast({
        title: 'Deployment Failed',
        description: error.message || 'Failed to deploy template',
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <AppLayout title="Application Templates" description="Deploy pre-configured applications with one click">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (error) {
    const isDockerError = error.includes('Docker') || error.includes('daemon');
    const isNetworkError = error.includes('network') || error.includes('connection');
    
    return (
      <AppLayout title="Application Templates" description="Deploy pre-configured applications with one click">
        {isDockerError ? (
          <DockerConnectionError onRetry={() => window.location.reload()} />
        ) : isNetworkError ? (
          <NetworkError onRetry={() => window.location.reload()} />
        ) : (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Application Templates" 
      description="Deploy pre-configured applications with one click"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {templates.length === 0 ? (
          <NoTemplatesState />
        ) : filteredTemplates.length === 0 ? (
          search || category !== 'all' ? (
            <SearchEmptyState 
              query={search || `category: ${category}`} 
              onClearSearch={() => {
                setSearch('');
                setCategory('all');
              }} 
            />
          ) : (
            <NoTemplatesState />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDeploy={handleDeploy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deployment Dialog */}
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{selectedTemplate?.icon}</span>
              Deploy {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Configure your {selectedTemplate?.name} deployment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Container Name */}
            <TextField
              label="Container Name"
              value={formData.name || ''}
              onChange={(value) => handleInputChange('name', value)}
              placeholder={`${selectedTemplate?.id}-container`}
              error={formErrors.name}
              required
            />

            {/* Required Config Fields */}
            {selectedTemplate?.requiredConfig?.map((field: any) => {
              if (field.name === 'name') return null; // Already handled above
              
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && '*'}
                  </Label>
                  {field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(value) => handleInputChange(field.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.defaultValue}
                    />
                  )}
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              );
            })}

            {/* Environment Variables */}
            {selectedTemplate?.defaultEnv && selectedTemplate.defaultEnv.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-sm">Environment Variables</h3>
                {selectedTemplate.defaultEnv.map((env: any) => (
                  <div key={env.name} className="space-y-2">
                    <Label htmlFor={env.name}>
                      {env.name} {env.required && '*'}
                    </Label>
                    <Input
                      id={env.name}
                      type={env.sensitive ? 'password' : 'text'}
                      value={formData[env.name] || ''}
                      onChange={(e) => handleInputChange(env.name, e.target.value)}
                      placeholder={env.value || `Enter ${env.name}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Port Information */}
            {selectedTemplate?.defaultPorts && selectedTemplate.defaultPorts.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold text-sm">Port Mappings</h3>
                <div className="space-y-2">
                  {selectedTemplate.defaultPorts.map((port: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Host Port:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{port.hostPort}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground">Container Port:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{port.containerPort}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeployDialogOpen(false);
                setFormErrors({});
              }}
              disabled={deploying}
            >
              Cancel
            </Button>
            <LoadingButton 
              onClick={handleDeploySubmit} 
              loading={deploying}
              loadingText="Deploying..."
            >
              Deploy
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
