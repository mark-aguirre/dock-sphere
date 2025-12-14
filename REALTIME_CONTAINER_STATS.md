# Real-time Container Management

This document describes the real-time container management system that provides live container status updates and monitoring.

## Features

### Real-time Container List
- **Live Status Updates**: Container status changes (running/stopped/paused) update immediately
- **Container Lifecycle**: New containers appear instantly, deleted containers disappear immediately
- **State Synchronization**: Perfect sync with Docker Desktop and CLI operations
- **Auto-refresh**: Container list updates every 3 seconds via Server-Sent Events (SSE)

## Implementation

### API Endpoint

#### Container List Stream
- **URL**: `/api/containers/stream`
- **Method**: GET
- **Type**: Server-Sent Events (SSE)
- **Update Interval**: 3 seconds
- **Purpose**: Real-time container list with status updates

### Components Updated

1. **Containers Page** (`app/containers/page.tsx`)
   - Integrates real-time stats with container list
   - Shows live connection status
   - Merges static container data with real-time stats

2. **Container Card** (`components/containers/ContainerCard.tsx`)
   - Displays CPU and memory usage bars
   - Only shows stats for running containers
   - Compact and normal view modes supported

3. **Containers Table** (`components/containers/ContainersTable.tsx`)
   - Added CPU and Memory columns
   - Progress bars for visual representation
   - Real-time data updates

### Hooks

- **`useRealtimeContainers`** (`hooks/use-realtime-containers.ts`)
  - Manages SSE connection to container list endpoint
  - Provides real-time container array with status updates
  - Handles reconnection and error states

### Data Flow

#### Container List Updates
1. **Container Stream Endpoint** polls Docker API every 3 seconds for all containers
2. **useRealtimeContainers Hook** receives container list updates
3. **Container Page** uses real-time data as primary source
4. **UI Updates** immediately reflect container status changes

## Usage

### In Container List
- Navigate to `/containers`
- **Status Updates**: Container status changes appear immediately (stop/start/restart)
- **Connection Indicator**: 
  - "Live" = Real-time container list active
  - "Static" = Fallback to manual refresh mode

### Real-time Behavior
- **Stop a container** in Docker Desktop → Status updates to "stopped" within 3 seconds
- **Start a container** → Status updates to "running" immediately
- **Delete a container** → Container disappears from list immediately
- **Create a container** → New container appears in list automatically

### Testing
- Visit `/realtime-test` to test all real-time features
- **Real-time Containers** section shows live container list updates
- **Connection Summary** shows status of all SSE connections

## Technical Details

### Data Structure
```typescript
interface ContainerStats {
  containerId: string;
  containerName: string;
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
  pids: number;
  timestamp: Date;
}
```

### Error Handling
- Automatic reconnection on connection loss
- Graceful degradation when Docker is unavailable
- Error states displayed in UI

### Performance
- Only running containers are monitored
- 2-second update interval balances responsiveness and performance
- Efficient SSE streaming reduces server load compared to polling

## Browser Compatibility
- Requires Server-Sent Events (SSE) support
- Works in all modern browsers
- Automatic fallback for connection issues