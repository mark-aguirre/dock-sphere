import { NextRequest, NextResponse } from 'next/server';
import { VolumeService } from '@/lib/services/volume-service';

const volumeService = new VolumeService();

/**
 * GET /api/volumes/:name/browse - Browse volume contents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    const entries = await volumeService.browseVolume(params.name, path);
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to browse volume',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
