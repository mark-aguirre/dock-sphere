'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuildOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  build: any;
}

export function BuildOutputDialog({ open, onOpenChange, build }: BuildOutputDialogProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (build?.output) {
      setOutput(build.output.split('\n'));
    }
  }, [build]);

  const handleDownload = () => {
    const blob = new Blob([build.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-${build.id}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(build.output);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Build output copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Build Output</DialogTitle>
              <DialogDescription>
                {build?.repository} • {build?.branch}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  build?.status === 'success'
                    ? 'default'
                    : build?.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {build?.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] w-full rounded-md border bg-muted/50 p-4">
          <div className="font-mono text-xs space-y-1">
            {output.map((line, index) => (
              <div
                key={index}
                className={
                  line.toLowerCase().includes('error')
                    ? 'text-destructive'
                    : line.toLowerCase().includes('warning')
                    ? 'text-yellow-500'
                    : 'text-foreground'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
