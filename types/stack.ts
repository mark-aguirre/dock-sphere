/**
 * Docker Compose stack data models
 */

export interface Stack {
  name: string;
  services: StackService[];
  networks: string[];
  volumes: string[];
  createdAt: Date;
  status: 'running' | 'stopped' | 'partial';
}

export interface StackService {
  name: string;
  containerId: string;
  image: string;
  status: string;
  ports: PortMapping[];
}

export interface PortMapping {
  containerPort: number;
  hostPort: number;
  protocol: 'tcp' | 'udp';
}

export interface ComposeDefinition {
  version: string;
  services: Record<string, any>;
  networks?: Record<string, any>;
  volumes?: Record<string, any>;
}

export interface StackDeployment {
  stackName: string;
  services: string[];
  networks: string[];
  volumes: string[];
  message: string;
}

export interface StackDetails extends Stack {
  composeFile?: string;
  environment?: Record<string, string>;
}
