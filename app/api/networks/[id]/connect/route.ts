import { NextRequest, NextResponse } from 'next/server';
import { NetworkService } from '@/lib/services/network-service';
import { ConnectionOptions } from '@/types/network';

const networkService = new NetworkService();

/**
 * POST /api/networks/:id/connect - Connect container
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { containerId, options }: { containerId: string; options?: ConnectionOptions } = await request.json();

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

    await networkService.connectContainer(containerId, params.id, options);
    
    return NextResponse.json({
      success: true,
      message: 'Container connected to network successfully'
    });
  } catch (error: any) {
    console.error('Error connecting container to network:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to connect container',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
