import { NextRequest, NextResponse } from 'next/server';
import { docker } from '@/lib/docker';
import { logger } from '@/lib/logger';
import { 
  withLogging, 
  extractRequestContext, 
  createErrorResponse 
} from '@/lib/middleware/logging-middleware';

/**
 * GET /api/containers - List all Docker containers
 */
export const GET = withLogging(async (request: NextRequest) => {
  const context = extractRequestContext(request);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') !== 'false'; // Default to showing all containers

    logger.dockerOperation('list', 'containers', undefined, {
      ...context,
      showAll: all
    });

    const startTime = Date.now();
    const containers = await docker.listContainers({ all });
    const duration = Date.now() - startTime;

    logger.performance('docker.listContainers', duration, {
      ...context,
      containerCount: containers.length
    });

    // Format the containers for the frontend
    const formattedContainers = containers.map((container: any) => ({
      id: container.Id,
      names: container.Names.map((name: string) => name.replace(/^\//, '')),
      image: container.Image,
      imageID: container.ImageID,
      command: container.Command,
      created: container.Created,
      state: container.State,
      status: container.Status,
      ports: container.Ports || [],
      labels: container.Labels || {},
      networkSettings: container.NetworkSettings,
      mounts: container.Mounts || []
    }));

    logger.info('Successfully listed containers', {
      ...context,
      containerCount: formattedContainers.length,
      showAll: all
    });

    return NextResponse.json(formattedContainers);
  } catch (error: any) {
    logger.dockerError('list', 'containers', error, context);
    return createErrorResponse(error, context, 500, 'CONTAINER_LIST_ERROR');
  }
});

/**
 * POST /api/containers - Create a new container
 */
export const POST = withLogging(async (request: NextRequest) => {
  const context = extractRequestContext(request);
  
  try {
    const body = await request.json();
    const {
      name,
      image,
      env = [],
      ports = [],
      volumes = [],
      command,
      entrypoint,
      restartPolicy = 'unless-stopped',
      networkMode,
      labels = {}
    } = body;

    logger.info('Creating container', {
      ...context,
      containerName: name,
      image,
      portCount: ports.length,
      volumeCount: volumes.length
    });

    if (!name || !image) {
      logger.warn('Container creation failed: missing required fields', {
        ...context,
        hasName: !!name,
        hasImage: !!image
      });
      
      return createErrorResponse(
        new Error('Container name and image are required'),
        context,
        400,
        'MISSING_REQUIRED_FIELDS'
      );
    }

    // Prepare port bindings
    const exposedPorts: Record<string, {}> = {};
    const portBindings: Record<string, any[]> = {};

    ports.forEach((port: any) => {
      const key = `${port.containerPort}/${port.protocol || 'tcp'}`;
      exposedPorts[key] = {};
      portBindings[key] = [{ HostPort: port.hostPort.toString() }];
    });

    // Prepare volume bindings
    const binds = volumes.map((vol: any) => {
      if (vol.hostPath && vol.containerPath) {
        return `${vol.hostPath}:${vol.containerPath}${vol.readOnly ? ':ro' : ''}`;
      }
      return null;
    }).filter(Boolean);

    // Create container configuration
    const containerConfig: any = {
      name,
      Image: image,
      Env: env,
      Labels: labels,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
        RestartPolicy: { Name: restartPolicy }
      }
    };

    if (command) {
      containerConfig.Cmd = Array.isArray(command) ? command : [command];
    }

    if (entrypoint) {
      containerConfig.Entrypoint = Array.isArray(entrypoint) ? entrypoint : [entrypoint];
    }

    if (networkMode) {
      containerConfig.HostConfig.NetworkMode = networkMode;
    }

    logger.dockerOperation('create', 'container', name, {
      ...context,
      containerName: name,
      image,
      restartPolicy,
      networkMode
    });

    // Create the container
    const startTime = Date.now();
    const container = await docker.createContainer(containerConfig);
    const containerInfo = await container.inspect();
    const duration = Date.now() - startTime;

    logger.performance('docker.createContainer', duration, {
      ...context,
      containerId: containerInfo.Id,
      containerName: name
    });

    logger.info('Container created successfully', {
      ...context,
      containerId: containerInfo.Id,
      containerName: name,
      state: containerInfo.State.Status
    });

    return NextResponse.json({
      success: true,
      message: `Container ${name} created successfully`,
      container: {
        id: containerInfo.Id,
        name: containerInfo.Name.replace(/^\//, ''),
        state: containerInfo.State
      }
    }, { status: 201 });
  } catch (error: any) {
    logger.dockerError('create', 'container', error, {
      ...context,
      containerName: (await request.json().catch(() => ({})))?.name
    });
    return createErrorResponse(error, context, 500, 'CONTAINER_CREATE_ERROR');
  }
});
