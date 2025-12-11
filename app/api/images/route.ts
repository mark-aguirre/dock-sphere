import { NextRequest, NextResponse } from 'next/server';
import { docker } from '@/lib/docker';
import { logger } from '@/lib/logger';
import { 
  withLogging, 
  extractRequestContext, 
  createErrorResponse 
} from '@/lib/middleware/logging-middleware';

/**
 * GET /api/images - List all Docker images
 */
export const GET = withLogging(async (request: NextRequest) => {
  const context = extractRequestContext(request);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    logger.dockerOperation('list', 'images', undefined, {
      ...context,
      showAll: all
    });

    const startTime = Date.now();
    const images = await docker.listImages({ all });
    const duration = Date.now() - startTime;

    logger.performance('docker.listImages', duration, {
      ...context,
      imageCount: images.length
    });

    // Format the images for the frontend
    const formattedImages = images.map((image: any) => ({
      id: image.Id,
      repoTags: image.RepoTags || ['<none>:<none>'],
      repoDigests: image.RepoDigests || [],
      created: image.Created,
      size: image.Size,
      virtualSize: image.VirtualSize,
      sharedSize: image.SharedSize,
      containers: image.Containers || 0,
      labels: image.Labels || {}
    }));

    logger.info('Successfully listed images', {
      ...context,
      imageCount: formattedImages.length,
      showAll: all
    });

    return NextResponse.json(formattedImages);
  } catch (error: any) {
    logger.dockerError('list', 'images', error, context);
    return createErrorResponse(error, context, 500, 'IMAGE_LIST_ERROR');
  }
});

/**
 * DELETE /api/images - Remove an image (via query param)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_IMAGE_ID',
            message: 'Image ID is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    const image = docker.getImage(imageId);
    await image.remove({ force: false });

    return NextResponse.json({
      success: true,
      message: `Image ${imageId} removed successfully`
    });
  } catch (error: any) {
    console.error('Error removing image:', error);
    return NextResponse.json(
      {
        error: {
          code: 'IMAGE_REMOVE_ERROR',
          message: error.message || 'Failed to remove image',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/images - Pull a Docker image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, tag = 'latest' } = body;

    if (!image) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_IMAGE_NAME',
            message: 'Image name is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    const imageName = tag ? `${image}:${tag}` : image;

    // Pull the image
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) {
          reject(err);
          return;
        }

        docker.modem.followProgress(stream, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        });
      });
    });

    return NextResponse.json({
      success: true,
      message: `Image ${imageName} pulled successfully`,
      image: imageName
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error pulling image:', error);
    return NextResponse.json(
      {
        error: {
          code: 'IMAGE_PULL_ERROR',
          message: error.message || 'Failed to pull image',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
