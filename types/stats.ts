/**
 * Container statistics data models
 */

export interface ContainerStats {
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

export interface AggregateStats {
  totalContainers: number;
  runningContainers: number;
  totalCpuPercent: number;
  totalMemoryUsage: number;
  totalMemoryLimit: number;
  totalNetworkRx: number;
  totalNetworkTx: number;
}

export interface ProcessedStats {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
  pids: number;
}
