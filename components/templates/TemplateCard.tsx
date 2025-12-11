import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink } from 'lucide-react';

interface TemplateCardProps {
  template: any;
  onDeploy?: (template: any) => void;
}

export function TemplateCard({ template, onDeploy }: TemplateCardProps) {
  return (
    <Card className="group hover:border-primary/30 hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2 p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
              {template.icon}
            </div>
            <div>
              <CardTitle className="text-sm">{template.name}</CardTitle>
              <Badge variant="secondary" className="mt-0.5 text-[10px] h-4 px-1.5">
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <CardDescription className="text-xs line-clamp-2">
          {template.description}
        </CardDescription>

        {template.website && (
          <a
            href={template.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Website
          </a>
        )}

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Image</span>
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] truncate max-w-[120px]" title={template.image}>
              {template.image}
            </span>
          </div>
          
          {template.defaultPorts && template.defaultPorts.length > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Ports</span>
              <div className="flex gap-0.5">
                {template.defaultPorts.slice(0, 2).map((port: any, i: number) => (
                  <span key={i} className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                    {port.containerPort}
                  </span>
                ))}
              </div>
            </div>
          )}

          {template.defaultEnv && template.defaultEnv.filter((e: any) => e.required).length > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Config</span>
              <span>{template.defaultEnv.filter((e: any) => e.required).length} vars</span>
            </div>
          )}
        </div>

        <Button 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors h-7 text-xs"
          variant="outline"
          onClick={() => onDeploy?.(template)}
        >
          <Download className="w-3 h-3 mr-1.5" />
          Deploy
        </Button>
      </CardContent>
    </Card>
  );
}
