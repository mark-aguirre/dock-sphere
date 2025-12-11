/**
 * Template data models for application templates
 */

export interface PortMapping {
  containerPort: number;
  hostPort: number;
  protocol: 'tcp' | 'udp';
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  required: boolean;
  sensitive: boolean;
}

export interface VolumeMount {
  containerPath: string;
  volumeName?: string;
  hostPath?: string;
  readOnly: boolean;
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description?: string;
}

export interface ServiceDefinition {
  name: string;
  image: string;
  ports: PortMapping[];
  environment: EnvironmentVariable[];
  volumes: VolumeMount[];
  dependsOn: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  image: string;
  defaultPorts: PortMapping[];
  defaultEnv: EnvironmentVariable[];
  defaultVolumes: VolumeMount[];
  requiredConfig: ConfigField[];
  multiContainer: boolean;
  services?: ServiceDefinition[];
}

export interface InstallationConfig {
  name: string;
  ports?: PortMapping[];
  environment?: Record<string, string>;
  volumes?: VolumeMount[];
  [key: string]: any;
}

export interface InstallationResult {
  success: boolean;
  containerIds: string[];
  containerNames: string[];
  connectionDetails?: Record<string, any>;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
