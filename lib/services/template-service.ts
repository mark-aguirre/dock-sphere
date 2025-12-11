import { 
  Template, 
  InstallationConfig, 
  InstallationResult, 
  ValidationResult,
  ValidationError as TemplateValidationError,
  PortMapping,
  EnvironmentVariable,
  VolumeMount
} from '@/types/template';
import { loadTemplates, loadTemplate } from '@/lib/template-loader';
import { docker } from '@/lib/docker';
import { ValidationError, NotFoundError, DockerError } from '@/lib/errors';

/**
 * Template Service for managing application templates and installations
 */
export class TemplateService {
  
  /**
   * Get all available application templates
   */
  async getTemplates(): Promise<Template[]> {
    return await loadTemplates();
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<Template> {
    const template = await loadTemplate(templateId);
    
    if (!template) {
      throw new NotFoundError('Template', templateId, [
        'Check the template ID is correct',
        'View available templates with GET /api/templates'
      ]);
    }
    
    return template;
  }

  /**
   * Install an application from a template
   */
  async installTemplate(
    templateId: string, 
    config: InstallationConfig
  ): Promise<InstallationResult> {
    // Load the template
    const template = await this.getTemplate(templateId);
    
    // Validate configuration
    const validation = this.validateConfig(templateId, config);
    if (!validation.valid) {
      throw new ValidationError(
        'Invalid template configuration',
        { errors: validation.errors },
        ['Check required fields', 'Verify port availability']
      );
    }

    try {
      if (template.multiContainer && template.services) {
        // Multi-container installation
        return await this.installMultiContainer(template, config);
      } else {
        // Single container installation
        return await this.installSingleContainer(template, config);
      }
    } catch (error: any) {
      throw new DockerError(
        `Failed to install template: ${error.message}`,
        error,
        ['Check Docker is running', 'Verify image is available', 'Check port availability']
      );
    }
  }

  /**
   * Install a single container from template
   */
  private async installSingleContainer(
    template: Template,
    config: InstallationConfig
  ): Promise<InstallationResult> {
    // Pull the image first
    await this.pullImage(template.image);

    // Prepare environment variables
    const env = this.prepareEnvironment(template, config);

    // Prepare port bindings
    const portBindings = this.preparePortBindings(
      config.ports || template.defaultPorts
    );

    // Prepare volumes
    const volumes = await this.prepareVolumes(
      config.volumes || template.defaultVolumes,
      config.name
    );

    // Create container
    const container = await docker.createContainer({
      name: config.name,
      Image: template.image,
      Env: env,
      ExposedPorts: this.getExposedPorts(config.ports || template.defaultPorts),
      HostConfig: {
        PortBindings: portBindings,
        Binds: volumes.binds,
        RestartPolicy: { Name: 'unless-stopped' }
      }
    });

    // Start the container
    await container.start();

    const containerInfo = await container.inspect();

    return {
      success: true,
      containerIds: [containerInfo.Id],
      containerNames: [config.name],
      connectionDetails: this.getConnectionDetails(template, config, containerInfo),
      message: `Successfully installed ${template.name}`
    };
  }

  /**
   * Install multiple containers from template
   */
  private async installMultiContainer(
    template: Template,
    config: InstallationConfig
  ): Promise<InstallationResult> {
    if (!template.services) {
      throw new ValidationError('Multi-container template missing services definition');
    }

    const containerIds: string[] = [];
    const containerNames: string[] = [];

    // Create a network for the services
    const networkName = `${config.name}-network`;
    const network = await docker.createNetwork({
      Name: networkName,
      Driver: 'bridge'
    });

    try {
      // Install each service
      for (const service of template.services) {
        await this.pullImage(service.image);

        const serviceName = `${config.name}-${service.name}`;
        const env = service.environment.map(e => `${e.name}=${e.value}`);

        const container = await docker.createContainer({
          name: serviceName,
          Image: service.image,
          Env: env,
          ExposedPorts: this.getExposedPorts(service.ports),
          HostConfig: {
            PortBindings: this.preparePortBindings(service.ports),
            NetworkMode: networkName,
            RestartPolicy: { Name: 'unless-stopped' }
          }
        });

        await container.start();
        const info = await container.inspect();
        
        containerIds.push(info.Id);
        containerNames.push(serviceName);
      }

      return {
        success: true,
        containerIds,
        containerNames,
        message: `Successfully installed ${template.name} with ${containerIds.length} services`
      };
    } catch (error: any) {
      // Cleanup on failure
      for (const containerId of containerIds) {
        try {
          const container = docker.getContainer(containerId);
          await container.stop();
          await container.remove();
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      try {
        await network.remove();
      } catch (cleanupError) {
        console.error('Network cleanup error:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * Validate template configuration
   */
  validateConfig(templateId: string, config: InstallationConfig): ValidationResult {
    const errors: TemplateValidationError[] = [];

    // Validate container name
    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Container name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Validate name format (Docker container name rules)
    if (config.name && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(config.name)) {
      errors.push({
        field: 'name',
        message: 'Container name must start with alphanumeric and contain only [a-zA-Z0-9_.-]',
        code: 'INVALID_FORMAT'
      });
    }

    // Validate ports
    if (config.ports) {
      config.ports.forEach((port, index) => {
        if (!port.containerPort || port.containerPort < 1 || port.containerPort > 65535) {
          errors.push({
            field: `ports[${index}].containerPort`,
            message: 'Container port must be between 1 and 65535',
            code: 'INVALID_PORT'
          });
        }
        if (!port.hostPort || port.hostPort < 1 || port.hostPort > 65535) {
          errors.push({
            field: `ports[${index}].hostPort`,
            message: 'Host port must be between 1 and 65535',
            code: 'INVALID_PORT'
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Pull Docker image
   */
  private async pullImage(image: string): Promise<void> {
    return new Promise((resolve, reject) => {
      docker.pull(image, (err: any, stream: any) => {
        if (err) {
          reject(err);
          return;
        }

        docker.modem.followProgress(stream, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Prepare environment variables
   */
  private prepareEnvironment(template: Template, config: InstallationConfig): string[] {
    const env: string[] = [];

    // Add default environment variables
    template.defaultEnv.forEach(envVar => {
      const value = config.environment?.[envVar.name] || envVar.value;
      if (value) {
        env.push(`${envVar.name}=${value}`);
      }
    });

    // Add custom environment variables from config
    if (config.environment) {
      Object.entries(config.environment).forEach(([key, value]) => {
        // Only add if not already in default env
        if (!template.defaultEnv.find(e => e.name === key)) {
          env.push(`${key}=${value}`);
        }
      });
    }

    return env;
  }

  /**
   * Prepare port bindings for Docker
   */
  private preparePortBindings(ports: PortMapping[]): Record<string, any> {
    const bindings: Record<string, any> = {};

    ports.forEach(port => {
      const key = `${port.containerPort}/${port.protocol}`;
      bindings[key] = [{ HostPort: port.hostPort.toString() }];
    });

    return bindings;
  }

  /**
   * Get exposed ports for Docker
   */
  private getExposedPorts(ports: PortMapping[]): Record<string, {}> {
    const exposed: Record<string, {}> = {};

    ports.forEach(port => {
      const key = `${port.containerPort}/${port.protocol}`;
      exposed[key] = {};
    });

    return exposed;
  }

  /**
   * Prepare volumes
   */
  private async prepareVolumes(
    volumes: VolumeMount[],
    containerName: string
  ): Promise<{ binds: string[] }> {
    const binds: string[] = [];

    for (const volume of volumes) {
      if (volume.volumeName) {
        // Named volume
        binds.push(`${volume.volumeName}:${volume.containerPath}${volume.readOnly ? ':ro' : ''}`);
      } else if (volume.hostPath) {
        // Host path bind mount
        binds.push(`${volume.hostPath}:${volume.containerPath}${volume.readOnly ? ':ro' : ''}`);
      } else {
        // Create a named volume
        const volumeName = `${containerName}-${volume.containerPath.replace(/\//g, '-')}`;
        await docker.createVolume({ Name: volumeName });
        binds.push(`${volumeName}:${volume.containerPath}${volume.readOnly ? ':ro' : ''}`);
      }
    }

    return { binds };
  }

  /**
   * Get connection details for the installed container
   */
  private getConnectionDetails(
    template: Template,
    config: InstallationConfig,
    containerInfo: any
  ): Record<string, any> {
    const details: Record<string, any> = {
      containerName: config.name,
      image: template.image,
      ports: {}
    };

    // Add port information
    const ports = config.ports || template.defaultPorts;
    ports.forEach(port => {
      details.ports[port.containerPort] = {
        hostPort: port.hostPort,
        protocol: port.protocol,
        url: `http://localhost:${port.hostPort}`
      };
    });

    // Add environment variables (non-sensitive)
    const nonSensitiveEnv: Record<string, string> = {};
    template.defaultEnv.forEach(envVar => {
      if (!envVar.sensitive) {
        const value = config.environment?.[envVar.name] || envVar.value;
        if (value) {
          nonSensitiveEnv[envVar.name] = value;
        }
      }
    });
    details.environment = nonSensitiveEnv;

    return details;
  }
}
