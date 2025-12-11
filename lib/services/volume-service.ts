import { 
  Volume, 
  VolumeDetails, 
  VolumeConfig,
  FileEntry
} from '@/types/volume';
import { docker } from '@/lib/docker';
import { ValidationError, NotFoundError, DockerError, ConflictError } from '@/lib/errors';

/**
 * Volume Service for managing Docker volumes
 */
export class VolumeService {
  
  /**
   * List all Docker volumes
   */
  async listVolumes(): Promise<Volume[]> {
    try {
      const result = await docker.listVolumes();
      const volumes = result.Volumes || [];
      
      return await Promise.all(
        volumes.map(async (vol) => await this.formatVolume(vol))
      );
    } catch (error: any) {
      throw new DockerError(
        `Failed to list volumes: ${error.message}`,
        error,
        ['Check Docker is running']
      );
    }
  }

  /**
   * Create a new Docker volume
   */
  async createVolume(config: VolumeConfig): Promise<Volume> {
    // Validate volume name
    if (!config.name || config.name.trim().length === 0) {
      throw new ValidationError(
        'Volume name is required',
        { field: 'name' },
        ['Provide a valid volume name']
      );
    }

    // Validate name format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(config.name)) {
      throw new ValidationError(
        'Volume name must start with alphanumeric and contain only [a-zA-Z0-9_.-]',
        { field: 'name', value: config.name },
        ['Use only alphanumeric characters, underscores, dots, and hyphens']
      );
    }

    try {
      // Check if volume already exists
      try {
        const volume = docker.getVolume(config.name);
        await volume.inspect();
        throw new ConflictError(
          `Volume with name '${config.name}' already exists`,
          { name: config.name },
          ['Choose a different volume name', 'Remove the existing volume first']
        );
      } catch (error: any) {
        // Volume doesn't exist, continue with creation
        if (error.statusCode !== 404 && !(error instanceof ConflictError)) {
          throw error;
        }
        if (error instanceof ConflictError) {
          throw error;
        }
      }

      // Create volume
      const volume = await docker.createVolume({
        Name: config.name,
        Driver: config.driver || 'local',
        DriverOpts: config.driverOpts || {},
        Labels: config.labels || {}
      });

      return await this.formatVolume(volume);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DockerError(
        `Failed to create volume: ${error.message}`,
        error,
        ['Check volume configuration', 'Verify driver is available']
      );
    }
  }

  /**
   * Delete a Docker volume
   */
  async deleteVolume(volumeName: string): Promise<void> {
    try {
      const volume = docker.getVolume(volumeName);
      const details = await volume.inspect();

      // Check if volume is in use
      const containers = await docker.listContainers({ all: true });
      const usingContainers = containers.filter(container => {
        const mounts = container.Mounts || [];
        return mounts.some((mount: any) => mount.Name === volumeName);
      });

      if (usingContainers.length > 0) {
        const containerNames = usingContainers
          .map(c => c.Names.map(n => n.replace('/', '')).join(', '))
          .join(', ');
        
        throw new ConflictError(
          `Cannot delete volume in use by containers`,
          { 
            volumeName, 
            usingContainers: containerNames 
          },
          [
            'Stop and remove containers using this volume first',
            `Containers using volume: ${containerNames}`
          ]
        );
      }

      await volume.remove();
    } catch (error: any) {
      if (error instanceof ConflictError) {
        throw error;
      }
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Volume',
          volumeName,
          ['Verify volume name']
        );
      }
      throw new DockerError(
        `Failed to delete volume: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get volume details
   */
  async inspectVolume(volumeName: string): Promise<VolumeDetails> {
    try {
      const volume = docker.getVolume(volumeName);
      const details = await volume.inspect();
      
      // Get containers using this volume
      const containers = await docker.listContainers({ all: true });
      const usedBy = containers
        .filter(container => {
          const mounts = container.Mounts || [];
          return mounts.some((mount: any) => mount.Name === volumeName);
        })
        .map(c => c.Names.map(n => n.replace('/', '')).join(', '));

      const formatted = await this.formatVolume(details);
      
      return {
        ...formatted,
        refCount: usedBy.length,
        status: details.Status
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Volume',
          volumeName,
          ['Verify volume name']
        );
      }
      throw new DockerError(
        `Failed to inspect volume: ${error.message}`,
        error
      );
    }
  }

  /**
   * Browse volume contents
   * Note: This requires mounting the volume to a temporary container
   */
  async browseVolume(volumeName: string, path: string = '/'): Promise<FileEntry[]> {
    try {
      // Verify volume exists
      const volume = docker.getVolume(volumeName);
      await volume.inspect();

      // Create a temporary container to access volume contents
      const container = await docker.createContainer({
        Image: 'alpine:latest',
        Cmd: ['ls', '-la', path],
        HostConfig: {
          Binds: [`${volumeName}:/volume:ro`],
          AutoRemove: true
        }
      });

      try {
        await container.start();
        
        // Wait for container to finish
        await container.wait();
        
        // Get logs (output of ls command)
        const logs = await container.logs({
          stdout: true,
          stderr: true
        });

        // Parse ls output
        const output = logs.toString();
        const entries = this.parseLsOutput(output, path);
        
        return entries;
      } finally {
        // Container will be auto-removed
        try {
          await container.remove({ force: true });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(
          'Volume',
          volumeName,
          ['Verify volume name']
        );
      }
      throw new DockerError(
        `Failed to browse volume: ${error.message}`,
        error,
        ['Ensure alpine image is available', 'Check volume permissions']
      );
    }
  }

  /**
   * Format volume data for API response
   */
  private async formatVolume(details: any): Promise<Volume> {
    // Get containers using this volume
    const containers = await docker.listContainers({ all: true });
    const usedBy = containers
      .filter(container => {
        const mounts = container.Mounts || [];
        return mounts.some((mount: any) => mount.Name === details.Name);
      })
      .map(c => c.Names.map(n => n.replace('/', '')).join(', '));

    return {
      name: details.Name,
      driver: details.Driver,
      mountpoint: details.Mountpoint,
      labels: details.Labels || {},
      scope: details.Scope,
      options: details.Options || {},
      createdAt: new Date(details.CreatedAt),
      usedBy
    };
  }

  /**
   * Parse ls -la output into FileEntry objects
   */
  private parseLsOutput(output: string, basePath: string): FileEntry[] {
    const lines = output.split('\n').filter(line => line.trim().length > 0);
    const entries: FileEntry[] = [];

    // Skip first line (total) and parse each entry
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/\s+/);
      
      if (parts.length < 9) continue;

      const permissions = parts[0];
      const size = parseInt(parts[4]) || 0;
      const name = parts.slice(8).join(' ');

      // Skip . and ..
      if (name === '.' || name === '..') continue;

      const type = permissions.startsWith('d') ? 'directory' : 'file';
      const fullPath = basePath.endsWith('/') 
        ? `${basePath}${name}` 
        : `${basePath}/${name}`;

      entries.push({
        name,
        path: fullPath,
        type,
        size,
        modifiedAt: new Date(), // ls -la doesn't give us full timestamp
        permissions
      });
    }

    return entries;
  }
}
