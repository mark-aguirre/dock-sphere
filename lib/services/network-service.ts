import { 
  Network, 
  NetworkConfig, 
  NetworkDetails,
  ContainerConnection,
  ConnectionOptions
} from '@/types/network';
import { docker } from '@/lib/docker';
import { ValidationError, NotFoundError, DockerError, ConflictError } from '@/lib/errors';

/**
 * Network Service for managing Docker networks
 */
export class NetworkService {
  
  /**
   * List all Docker networks
   */
  async listNetworks(): Promise<Network[]> {
    try {
      const networks = await docker.listNetworks();
      
      return await Promise.all(
        networks.map(async (net) => {
          const networkObj = docker.getNetwork(net.Id);
          const details = await networkObj.inspect();
          
          return this.formatNetwork(details);
        })
      );
    } catch (error: any) {
      throw new DockerError(
        `Failed to list networks: ${error.message}`,
        error,
        ['Check Docker is running']
      );
    }
  }

  /**
   * Create a new Docker network
   */
  async createNetwork(config: NetworkConfig): Promise<Network> {
    // Validate network name
    if (!config.name || config.name.trim().length === 0) {
      throw new ValidationError(
        'Network name is required',
        { field: 'name' },
        ['Provide a valid network name']
      );
    }

    // Validate name format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(config.name)) {
      throw new ValidationError(
        'Network name must start with alphanumeric and contain only [a-zA-Z0-9_.-]',
        { field: 'name', value: config.name },
        ['Use only alphanumeric characters, underscores, dots, and hyphens']
      );
    }

    try {
      // Check if network already exists
      const existing = await docker.listNetworks({ 
        filters: { name: [config.name] } 
      });
      
      if (existing.length > 0) {
        throw new ConflictError(
          `Network with name '${config.name}' already exists`,
          { name: config.name },
          ['Choose a different network name', 'Remove the existing network first']
        );
      }

      // Create network
      const network = await docker.createNetwork({
        Name: config.name,
        Driver: config.driver || 'bridge',
        Internal: config.internal || false,
        Attachable: config.attachable !== false,
        IPAM: config.ipam as any,
        Labels: config.labels || {},
        Options: config.options || {}
      });

      // Get network details
      const details = await network.inspect();
      return this.formatNetwork(details);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DockerError(
        `Failed to create network: ${error.message}`,
        error,
        ['Check network configuration', 'Verify subnet is not in use']
      );
    }
  }

  /**
   * Connect a container to a network
   */
  async connectContainer(
    containerId: string,
    networkId: string,
    options?: ConnectionOptions
  ): Promise<void> {
    try {
      // Verify container exists
      const container = docker.getContainer(containerId);
      await container.inspect();

      // Verify network exists
      const network = docker.getNetwork(networkId);
      await network.inspect();

      // Connect container to network
      await network.connect({
        Container: containerId,
        EndpointConfig: {
          Aliases: options?.aliases || [],
          IPAMConfig: {
            IPv4Address: options?.ipv4Address,
            IPv6Address: options?.ipv6Address,
            LinkLocalIPs: options?.linkLocalIPs
          }
        }
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Container or Network',
          `${containerId} / ${networkId}`,
          ['Verify container and network IDs']
        );
      }
      throw new DockerError(
        `Failed to connect container to network: ${error.message}`,
        error,
        ['Check container is not already connected', 'Verify network configuration']
      );
    }
  }

  /**
   * Disconnect a container from a network
   */
  async disconnectContainer(
    containerId: string,
    networkId: string
  ): Promise<void> {
    try {
      const network = docker.getNetwork(networkId);
      await network.disconnect({
        Container: containerId,
        Force: false
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Container or Network',
          `${containerId} / ${networkId}`,
          ['Verify container and network IDs']
        );
      }
      throw new DockerError(
        `Failed to disconnect container from network: ${error.message}`,
        error,
        ['Check container is connected to the network']
      );
    }
  }

  /**
   * Delete a Docker network
   */
  async deleteNetwork(networkId: string): Promise<void> {
    try {
      const network = docker.getNetwork(networkId);
      const details = await network.inspect();

      // Check if any containers are connected
      const connectedContainers = Object.keys(details.Containers || {});
      if (connectedContainers.length > 0) {
        const containerNames = Object.values(details.Containers || {})
          .map((c: any) => c.Name)
          .join(', ');
        
        throw new ConflictError(
          `Cannot delete network with connected containers`,
          { 
            networkId, 
            connectedContainers: containerNames 
          },
          [
            'Disconnect all containers first',
            `Connected containers: ${containerNames}`
          ]
        );
      }

      // Prevent deletion of default networks
      const defaultNetworks = ['bridge', 'host', 'none'];
      if (defaultNetworks.includes(details.Name)) {
        throw new ValidationError(
          `Cannot delete default network '${details.Name}'`,
          { networkName: details.Name },
          ['Default networks cannot be deleted']
        );
      }

      await network.remove();
    } catch (error: any) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Network',
          networkId,
          ['Verify network ID or name']
        );
      }
      throw new DockerError(
        `Failed to delete network: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get network details including connected containers
   */
  async inspectNetwork(networkId: string): Promise<NetworkDetails> {
    try {
      const network = docker.getNetwork(networkId);
      const details = await network.inspect();
      
      return {
        ...this.formatNetwork(details),
        options: details.Options || {},
        enableIPv6: details.EnableIPv6 || false
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Network',
          networkId,
          ['Verify network ID or name']
        );
      }
      throw new DockerError(
        `Failed to inspect network: ${error.message}`,
        error
      );
    }
  }

  /**
   * Format network data for API response
   */
  private formatNetwork(details: any): Network {
    const containers: ContainerConnection[] = [];
    
    if (details.Containers) {
      Object.entries(details.Containers).forEach(([id, info]: [string, any]) => {
        containers.push({
          containerId: id,
          containerName: info.Name,
          ipAddress: info.IPv4Address?.split('/')[0] || '',
          aliases: info.Aliases || []
        });
      });
    }

    return {
      id: details.Id,
      name: details.Name,
      driver: details.Driver,
      scope: details.Scope,
      internal: details.Internal || false,
      attachable: details.Attachable || false,
      ipam: {
        driver: details.IPAM?.Driver || 'default',
        config: (details.IPAM?.Config || []).map((cfg: any) => ({
          subnet: cfg.Subnet || '',
          gateway: cfg.Gateway || ''
        }))
      },
      containers,
      labels: details.Labels || {},
      createdAt: new Date(details.Created)
    };
  }
}
