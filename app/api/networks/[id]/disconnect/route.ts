import { NextRequest, NextResponse } from 'next/server';
import { NetworkService } from '@/lib/services/network-service';

const networkService = new NetworkService();

/**
 * POST /api/networks/:id/disconnect - Disconnect container
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { containerId }: { containerId: string } = await request.json();

    if (!containerId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Container ID is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    await networkService.disconnectContainer(containerId, params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Container disconnected from network successfully'
    });
  } catch (error: any) {
    console.error('Error disconnecting container from network:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to disconnect container',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
