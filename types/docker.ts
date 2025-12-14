export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'created';
  state: string;
  created: string;
  ports: PortMapping[];
  networks: string[];
  volumes: VolumeMount[];
  // Legacy fields for backward compatibility
  cpu: number;
  memory: number;
  memoryLimit: number;
}

export interface PortMapping {
  containerPort: number;
  hostPort: number;
  protocol: 'tcp' | 'udp';
}

export interface VolumeMount {
  source: string;
  destination: string;
  mode: 'rw' | 'ro';
}

export interface DockerImage {
  id: string;
  repoTags: string[];
  size: number;
  created: number;
  containers: number;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  containers: string[];
  ipam: {
    subnet: string;
    gateway: string;
  };
  created: string;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  size: number;
  created: string;
  inUse: boolean;
  containers: string[];
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  icon: string;
  ports: PortMapping[];
  env: { name: string; value: string; required: boolean }[];
  volumes: { name: string; path: string }[];
}



export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}
