/**
 * Volume data models
 */

export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  labels: Record<string, string>;
  scope: string;
  options: Record<string, string>;
  createdAt: Date;
  size?: number;
  usedBy: string[];
}

export interface VolumeDetails extends Volume {
  refCount: number;
  status?: Record<string, any>;
}

export interface VolumeConfig {
  name: string;
  driver?: string;
  driverOpts?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: Date;
  permissions: string;
}
