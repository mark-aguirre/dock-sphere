import { NextRequest, NextResponse } from 'next/server';
import { StackService } from '@/lib/services/stack-service';

const stackService = new StackService();

/**
 * POST /api/stacks/:name/stop - Stop stack
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await stackService.stopStack(params.name);
    return NextResponse.json({
      success: true,
      message: `Stack '${params.name}' stopped successfully`
    });
  } catch (error: any) {
    console.error('Error stopping stack:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to stop stack',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
