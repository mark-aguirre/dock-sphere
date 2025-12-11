import { NextRequest, NextResponse } from 'next/server';
import { docker } from '@/lib/docker';
import { logger } from '@/lib/logger';
import { DockerLogger } from '@/lib/docker-logger';
import { 
  withLogging, 
  extractRequestContext, 
  createErrorResponse 
} from '@/lib/middleware/logging-middleware';

/**
 * GET /api/containers/:id - Get container details
 */
export const GET = withLogging(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const context = extractRequestContext(request);
  
  try {
    DockerLogger.container.inspect(params.id, {
      ...context,
      containerId: params.id
    });

    const startTime = Date.now();
    const container = docker.getContainer(params.id);
    const containerInfo = await container.inspect();
    const duration = Date.now() - startTime;

    DockerLogger.performance.operation('inspect', 'container', duration, {
      ...context,
      containerId: params.id,
      containerName: containerInfo.Name.replace(/^\//, '')
    });

    logger.info('Container details retrieved', {
      ...context,
      containerId: params.id,
      containerName: containerInfo.Name.replace(/^\//, ''),
      state: containerInfo.State.Status
    });

    return NextResponse.json({
      id: containerInfo.Id,
      name: containerInfo.Name.replace(/^\//, ''),
      image: containerInfo.Config.Image,
      created: containerInfo.Created,
      state: containerInfo.State,
      config: containerInfo.Config,
      hostConfig: containerInfo.HostConfig,
      networkSettings: containerInfo.NetworkSettings,
      mounts: containerInfo.Mounts,
      platform: containerInfo.Platform
    });
  } catch (error: any) {
    DockerLogger.error.operation('inspect', 'container', error, {
      ...context,
      containerId: params.id
    });
    return createErrorResponse(error, context, error.statusCode || 500, 'CONTAINER_INSPECT_ERROR');
  }
});

/**
 * DELETE /api/containers/:id - Remove a container
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    const container = docker.getContainer(params.id);
    await container.remove({ force });

    return NextResponse.json({
      success: true,
      message: `Container ${params.id} removed successfully`
    });
  } catch (error: any) {
    console.error('Error removing container:', error);
    return NextResponse.json(
      {
        error: {
          code: 'CONTAINER_REMOVE_ERROR',
          message: error.message || 'Failed to remove container',
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PATCH /api/containers/:id - Update container (start, stop, restart, pause, unpause)
 */
export const PATCH = withLogging(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const context = extractRequestContext(request);
  
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      logger.warn('Container action failed: missing action', {
        ...context,
        containerId: params.id
      });
      
      return createErrorResponse(
        new Error('Action is required (start, stop, restart, pause, unpause)'),
        context,
        400,
        'MISSING_ACTION'
      );
    }

    const validActions = ['start', 'stop', 'restart', 'pause', 'unpause', 'kill'];
    if (!validActions.includes(action)) {
      logger.warn('Container action failed: invalid action', {
        ...context,
        containerId: params.id,
        action,
        validActions
      });
      
      return createErrorResponse(
        new Error(`Invalid action: ${action}. Valid actions: ${validActions.join(', ')}`),
        context,
        400,
        'INVALID_ACTION'
      );
    }

    logger.info(`Performing container action: ${action}`, {
      ...context,
      containerId: params.id,
      action
    });

    const startTime = Date.now();
    const container = docker.getContainer(params.id);

    switch (action) {
      case 'start':
        DockerLogger.container.start(params.id, undefined, context);
        await container.start();
        break;
      case 'stop':
        DockerLogger.container.stop(params.id, undefined, context);
        await container.stop();
        break;
      case 'restart':
        logger.dockerOperation('restart', 'container', params.id, {
          ...context,
          containerId: params.id
        });
        await container.restart();
        break;
      case 'pause':
        logger.dockerOperation('pause', 'container', params.id, {
          ...context,
          containerId: params.id
        });
        await container.pause();
        break;
      case 'unpause':
        logger.dockerOperation('unpause', 'container', params.id, {
          ...context,
          containerId: params.id
        });
        await container.unpause();
        break;
      case 'kill':
        logger.dockerOperation('kill', 'container', params.id, {
          ...context,
          containerId: params.id
        });
        await container.kill();
        break;
    }

    const duration = Date.now() - startTime;
    DockerLogger.performance.operation(action, 'container', duration, {
      ...context,
      containerId: params.id,
      action
    });

    logger.info(`Container ${action} completed successfully`, {
      ...context,
      containerId: params.id,
      action,
      duration
    });

    return NextResponse.json({
      success: true,
      message: `Container ${action} successful`,
      action
    });
  } catch (error: any) {
    DockerLogger.error.operation('action', 'container', error, {
      ...context,
      containerId: params.id,
      action: (await request.json().catch(() => ({})))?.action
    });
    return createErrorResponse(error, context, error.statusCode || 500, 'CONTAINER_ACTION_ERROR');
  }
});
