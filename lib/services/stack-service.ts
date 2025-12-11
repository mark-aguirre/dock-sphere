import { 
  Stack, 
  StackService as StackServiceType,
  ComposeDefinition,
  StackDeployment,
  StackDetails
} from '@/types/stack';
import { docker } from '@/lib/docker';
import { ValidationError, NotFoundError, DockerError } from '@/lib/errors';
import YAML from 'yaml';

/**
 * Stack Service for managing Docker Compose stacks
 */
export class StackService {
  private readonly STACK_LABEL = 'com.docker.compose.project';
  
  /**
   * Parse a Docker Compose file
   */
  async parseComposeFile(composeContent: string): Promise<ComposeDefinition> {
    try {
      const parsed = YAML.parse(composeContent);
      
      if (!parsed.services) {
        throw new ValidationError(
          'Invalid Compose file: missing services section',
          { content: composeContent.substring(0, 100) },
          ['Ensure the Compose file has a services section']
        );
      }

      return {
        version: parsed.version || '3',
        services: parsed.services,
        networks: parsed.networks || {},
        volumes: parsed.volumes || {}
      };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to parse Compose file: ${error.message}`,
        { error: error.message },
        ['Check YAML syntax', 'Verify Compose file format']
      );
    }
  }

  /**
   * Deploy a Docker Compose stack
   */
  async deployStack(
    stackName: string,
    composeContent: string
  ): Promise<StackDeployment> {
    // Validate stack name
    if (!stackName || !/^[a-z0-9][a-z0-9_-]*$/.test(stackName)) {
      throw new ValidationError(
        'Invalid stack name: must be lowercase alphanumeric with hyphens/underscores',
        { stackName },
        ['Use lowercase letters, numbers, hyphens, and underscores only']
      );
    }

    // Parse the Compose file
    const compose = await this.parseComposeFile(composeContent);

    const createdServices: string[] = [];
    const createdNetworks: string[] = [];
    const createdVolumes: string[] = [];

    try {
      // Create networks
      if (compose.networks) {
        for (const [networkName, networkConfig] of Object.entries(compose.networks)) {
          const fullNetworkName = `${stackName}_${networkName}`;
          try {
            await docker.createNetwork({
              Name: fullNetworkName,
              Driver: (networkConfig as any)?.driver || 'bridge',
              Labels: {
                [this.STACK_LABEL]: stackName,
                'com.docker.compose.network': networkName
              }
            });
            createdNetworks.push(fullNetworkName);
          } catch (error: any) {
            // Network might already exist
            if (error.statusCode !== 409) {
              throw error;
            }
          }
        }
      }

      // Create volumes
      if (compose.volumes) {
        for (const [volumeName, volumeConfig] of Object.entries(compose.volumes)) {
          const fullVolumeName = `${stackName}_${volumeName}`;
          try {
            await docker.createVolume({
              Name: fullVolumeName,
              Driver: (volumeConfig as any)?.driver || 'local',
              Labels: {
                [this.STACK_LABEL]: stackName,
                'com.docker.compose.volume': volumeName
              }
            });
            createdVolumes.push(fullVolumeName);
          } catch (error: any) {
            // Volume might already exist
            if (error.statusCode !== 409) {
              throw error;
            }
          }
        }
      }

      // Create and start services
      for (const [serviceName, serviceConfig] of Object.entries(compose.services)) {
        const containerName = `${stackName}_${serviceName}_1`;
        const config = serviceConfig as any;

        // Prepare environment variables
        const env: string[] = [];
        if (config.environment) {
          if (Array.isArray(config.environment)) {
            env.push(...config.environment);
          } else {
            Object.entries(config.environment).forEach(([key, value]) => {
              env.push(`${key}=${value}`);
            });
          }
        }

        // Prepare port bindings
        const exposedPorts: Record<string, {}> = {};
        const portBindings: Record<string, any> = {};
        if (config.ports) {
          config.ports.forEach((portMapping: string) => {
            const [hostPort, containerPort] = portMapping.split(':');
            const key = `${containerPort}/tcp`;
            exposedPorts[key] = {};
            portBindings[key] = [{ HostPort: hostPort }];
          });
        }

        // Prepare volume bindings
        const binds: string[] = [];
        if (config.volumes) {
          config.volumes.forEach((volume: string) => {
            if (volume.includes(':')) {
              const [source, target] = volume.split(':');
              // Check if it's a named volume
              if (!source.startsWith('/') && !source.startsWith('.')) {
                binds.push(`${stackName}_${source}:${target}`);
              } else {
                binds.push(volume);
              }
            }
          });
        }

        // Determine network mode
        let networkMode = 'bridge';
        if (compose.networks && Object.keys(compose.networks).length > 0) {
          const firstNetwork = Object.keys(compose.networks)[0];
          networkMode = `${stackName}_${firstNetwork}`;
        }

        // Create container
        const container = await docker.createContainer({
          name: containerName,
          Image: config.image,
          Env: env,
          ExposedPorts: exposedPorts,
          Labels: {
            [this.STACK_LABEL]: stackName,
            'com.docker.compose.service': serviceName
          },
          HostConfig: {
            PortBindings: portBindings,
            Binds: binds,
            NetworkMode: networkMode,
            RestartPolicy: { Name: config.restart || 'unless-stopped' }
          }
        });

        // Start container
        await container.start();
        createdServices.push(containerName);
      }

      return {
        stackName,
        services: createdServices,
        networks: createdNetworks,
        volumes: createdVolumes,
        message: `Successfully deployed stack '${stackName}' with ${createdServices.length} services`
      };
    } catch (error: any) {
      // Cleanup on failure
      console.error('Stack deployment failed, cleaning up...', error);
      
      // Remove created containers
      for (const serviceName of createdServices) {
        try {
          const container = docker.getContainer(serviceName);
          await container.stop();
          await container.remove();
        } catch (e) {
          console.error(`Failed to cleanup container ${serviceName}:`, e);
        }
      }

      throw new DockerError(
        `Failed to deploy stack: ${error.message}`,
        error,
        ['Check Compose file syntax', 'Verify images are available', 'Check port availability']
      );
    }
  }

  /**
   * List all active stacks
   */
  async listStacks(): Promise<Stack[]> {
    try {
      const containers = await docker.listContainers({ all: true });
      
      // Group containers by stack name
      const stackMap = new Map<string, any[]>();
      
      containers.forEach(container => {
        const stackLabel = container.Labels?.[this.STACK_LABEL];
        if (stackLabel) {
          if (!stackMap.has(stackLabel)) {
            stackMap.set(stackLabel, []);
          }
          stackMap.get(stackLabel)!.push(container);
        }
      });

      // Build stack objects
      const stacks: Stack[] = [];
      
      for (const [stackName, stackContainers] of stackMap.entries()) {
        const services: StackServiceType[] = stackContainers.map(container => ({
          name: container.Labels['com.docker.compose.service'] || container.Names[0].replace('/', ''),
          containerId: container.Id,
          image: container.Image,
          status: container.State,
          ports: (container.Ports || []).map((p: any) => ({
            containerPort: p.PrivatePort,
            hostPort: p.PublicPort || 0,
            protocol: p.Type as 'tcp' | 'udp'
          }))
        }));

        // Get networks and volumes for this stack
        const networks = await this.getStackNetworks(stackName);
        const volumes = await this.getStackVolumes(stackName);

        // Determine stack status
        const runningCount = stackContainers.filter(c => c.State === 'running').length;
        let status: 'running' | 'stopped' | 'partial';
        if (runningCount === 0) {
          status = 'stopped';
        } else if (runningCount === stackContainers.length) {
          status = 'running';
        } else {
          status = 'partial';
        }

        stacks.push({
          name: stackName,
          services,
          networks,
          volumes,
          createdAt: new Date(stackContainers[0].Created * 1000),
          status
        });
      }

      return stacks;
    } catch (error: any) {
      throw new DockerError(
        `Failed to list stacks: ${error.message}`,
        error
      );
    }
  }

  /**
   * Stop a stack (stop all services)
   */
  async stopStack(stackName: string): Promise<void> {
    try {
      const containers = await this.getStackContainers(stackName);
      
      if (containers.length === 0) {
        throw new NotFoundError(
          'Stack',
          stackName,
          ['Verify stack name', 'List available stacks with GET /api/stacks']
        );
      }

      // Stop all containers
      await Promise.all(
        containers.map(async (containerInfo) => {
          try {
            const container = docker.getContainer(containerInfo.Id);
            await container.stop();
          } catch (error: any) {
            // Container might already be stopped
            if (error.statusCode !== 304) {
              throw error;
            }
          }
        })
      );
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DockerError(
        `Failed to stop stack: ${error.message}`,
        error
      );
    }
  }

  /**
   * Remove a stack (remove all containers, networks, volumes)
   */
  async removeStack(stackName: string, removeVolumes: boolean = false): Promise<void> {
    try {
      const containers = await this.getStackContainers(stackName);
      
      if (containers.length === 0) {
        throw new NotFoundError(
          'Stack',
          stackName,
          ['Verify stack name', 'List available stacks with GET /api/stacks']
        );
      }

      // Stop and remove all containers
      await Promise.all(
        containers.map(async (containerInfo) => {
          try {
            const container = docker.getContainer(containerInfo.Id);
            await container.stop();
            await container.remove();
          } catch (error: any) {
            // Container might already be stopped/removed
            console.error(`Error removing container ${containerInfo.Id}:`, error);
          }
        })
      );

      // Remove networks
      const networks = await this.getStackNetworks(stackName);
      await Promise.all(
        networks.map(async (networkName) => {
          try {
            const network = docker.getNetwork(networkName);
            await network.remove();
          } catch (error: any) {
            console.error(`Error removing network ${networkName}:`, error);
          }
        })
      );

      // Remove volumes if requested
      if (removeVolumes) {
        const volumes = await this.getStackVolumes(stackName);
        await Promise.all(
          volumes.map(async (volumeName) => {
            try {
              const volume = docker.getVolume(volumeName);
              await volume.remove();
            } catch (error: any) {
              console.error(`Error removing volume ${volumeName}:`, error);
            }
          })
        );
      }
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DockerError(
        `Failed to remove stack: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get stack details
   */
  async getStackDetails(stackName: string): Promise<StackDetails> {
    try {
      const stacks = await this.listStacks();
      const stack = stacks.find(s => s.name === stackName);
      
      if (!stack) {
        throw new NotFoundError(
          'Stack',
          stackName,
          ['Verify stack name', 'List available stacks with GET /api/stacks']
        );
      }

      return stack as StackDetails;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DockerError(
        `Failed to get stack details: ${error.message}`,
        error
      );
    }
  }

  // Private helper methods

  private async getStackContainers(stackName: string): Promise<any[]> {
    const containers = await docker.listContainers({ all: true });
    return containers.filter(c => c.Labels?.[this.STACK_LABEL] === stackName);
  }

  private async getStackNetworks(stackName: string): Promise<string[]> {
    const networks = await docker.listNetworks();
    return networks
      .filter(n => n.Labels?.[this.STACK_LABEL] === stackName)
      .map(n => n.Name);
  }

  private async getStackVolumes(stackName: string): Promise<string[]> {
    const result = await docker.listVolumes();
    const volumes = result.Volumes || [];
    return volumes
      .filter(v => v.Labels?.[this.STACK_LABEL] === stackName)
      .map(v => v.Name);
  }
}
