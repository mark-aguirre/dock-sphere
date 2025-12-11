import { NextRequest, NextResponse } from 'next/server';
import { NetworkService } from '@/lib/services/network-service';

const networkService = new NetworkService();

/**
 * GET /api/networks/:id - Inspect network
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const network = await networkService.inspectNetwork(params.id);
    return NextResponse.json(network);
  } catch (error: any) {
    console.error('Error inspecting network:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to inspect network',
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
 * DELETE /api/networks/:id - Delete network
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await networkService.deleteNetwork(params.id);
    return NextResponse.json({ 
      success: true,
      message: 'Network deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting network:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete network',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
