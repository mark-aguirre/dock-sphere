/**
 * Network data models
 */

export interface Network {
  id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  attachable: boolean;
  ipam: IPAMConfig;
  containers: ContainerConnection[];
  labels: Record<string, string>;
  createdAt: Date;
}

export interface IPAMConfig {
  driver: string;
  config: {
    subnet: string;
    gateway: string;
  }[];
}

export interface ContainerConnection {
  containerId: string;
  containerName: string;
  ipAddress: string;
  aliases: string[];
}

export interface NetworkConfig {
  name: string;
  driver?: string;
  internal?: boolean;
  attachable?: boolean;
  ipam?: {
    driver?: string;
    config?: {
      subnet?: string;
      gateway?: string;
      ipRange?: string;
    }[];
  };
  labels?: Record<string, string>;
  options?: Record<string, string>;
}

export interface NetworkDetails extends Network {
  options: Record<string, string>;
  enableIPv6: boolean;
}

export interface ConnectionOptions {
  aliases?: string[];
  ipv4Address?: string;
  ipv6Address?: string;
  linkLocalIPs?: string[];
}
