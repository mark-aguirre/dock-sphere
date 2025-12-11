import { NextRequest, NextResponse } from 'next/server';
import { StackService } from '@/lib/services/stack-service';

const stackService = new StackService();

/**
 * GET /api/stacks/:name - Get stack details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const stack = await stackService.getStackDetails(params.name);
    return NextResponse.json(stack);
  } catch (error: any) {
    console.error('Error getting stack details:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to get stack details',
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
 * DELETE /api/stacks/:name - Remove stack
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const removeVolumes = searchParams.get('volumes') === 'true';
    
    await stackService.removeStack(params.name, removeVolumes);
    return NextResponse.json({
      success: true,
      message: `Stack '${params.name}' removed successfully`
    });
  } catch (error: any) {
    console.error('Error removing stack:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to remove stack',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
