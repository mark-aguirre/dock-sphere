import { NextRequest, NextResponse } from 'next/server';
import { VolumeService } from '@/lib/services/volume-service';

const volumeService = new VolumeService();

/**
 * GET /api/volumes/:name - Inspect volume
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const volume = await volumeService.inspectVolume(params.name);
    return NextResponse.json(volume);
  } catch (error: any) {
    console.error('Error inspecting volume:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to inspect volume',
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
 * DELETE /api/volumes/:name - Delete volume
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await volumeService.deleteVolume(params.name);
    return NextResponse.json({ 
      success: true,
      message: 'Volume deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting volume:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete volume',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
