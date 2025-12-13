import { NextRequest, NextResponse } from 'next/server';
import { VolumeService } from '@/lib/services/volume-service';
import { VolumeConfig } from '@/types/volume';

const volumeService = new VolumeService();

/**
 * GET /api/volumes - List volumes
 */
export async function GET() {
  try {
    const volumes = await volumeService.listVolumes();
    return NextResponse.json(volumes);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to list volumes',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/volumes - Create volume
 */
export async function POST(request: NextRequest) {
  try {
    const config: VolumeConfig = await request.json();
    const volume = await volumeService.createVolume(config);
    return NextResponse.json(volume, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to create volume',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
