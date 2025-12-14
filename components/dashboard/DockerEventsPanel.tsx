'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDockerEvents } from '@/hooks/use-docker-events';
import { Activity, Trash2, Container, Image, Network, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DockerEventsPanelProps {
  className?: string;
}

export function DockerEventsPanel({ className }: DockerEventsPanelProps) {
  const { toast } = useToast();
  const { events, isConnected, clearEvents } = useDockerEvents();

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'container':
        return Container;
      case 'image':
        return Image;
      case 'network':
        return Network;
      case 'volume':
        return HardDrive;
      default:
        return Activity;
    }
  };

  const getEventColor = (action: string) => {
    if (['start', 'create', 'pull'].includes(action)) return 'default';
    if (['stop', 'pause'].includes(action)) return 'secondary';
    if (['destroy', 'remove', 'delete'].includes(action)) return 'destructive';
    if (['restart', 'unpause', 'resume'].includes(action)) return 'outline';
    return 'outline';
  };

  const formatEventName = (attributes: Record<string, string>, eventType: string) => {
    return attributes.name || attributes.image || `${eventType}-${Date.now()}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleClearEvents = () => {
    clearEvents();
    toast({
      title: "Events cleared",
      description: "All Docker events have been cleared",
    });
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Docker Events
            </CardTitle>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="text-xs"
            >
              {isConnected ? "Live" : "Disconnected"}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearEvents}
            disabled={events.length === 0}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-80 w-full">
          <div className="p-4 space-y-2">
            {events.length === 0 ? (
              <div className="text-muted-foreground text-center py-8 text-sm">
                {isConnected ? "Waiting for Docker events..." : "Connecting to Docker events..."}
              </div>
            ) : (
              events.map((event, index) => {
                const Icon = getEventIcon(event.eventType);
                const eventName = formatEventName(event.actor.attributes, event.eventType);
                
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={getEventColor(event.action)}
                          className="text-xs"
                        >
                          {event.action}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.eventType}
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-medium truncate" title={eventName}>
                        {eventName}
                      </div>
                      
                      {event.actor.attributes.image && event.eventType === 'container' && (
                        <div className="text-xs text-muted-foreground truncate" title={event.actor.attributes.image}>
                          {event.actor.attributes.image}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatTime(event.time)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>{events.length} events</span>
          <span>Real-time Docker activity</span>
        </div>
      </CardContent>
    </Card>
  );
}