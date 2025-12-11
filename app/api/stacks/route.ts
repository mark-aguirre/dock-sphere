import { NextRequest, NextResponse } from 'next/server';
import { StackService } from '@/lib/services/stack-service';

const stackService = new StackService();

/**
 * GET /api/stacks - List stacks
 */
export async function GET() {
  try {
    const stacks = await stackService.listStacks();
    return NextResponse.json(stacks);
  } catch (error: any) {
    console.error('Error listing stacks:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to list stacks',
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
 * POST /api/stacks - Deploy stack
 */
export async function POST(request: NextRequest) {
  try {
    const { stackName, composeContent } = await request.json();

    if (!stackName || !composeContent) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Stack name and compose content are required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    const result = await stackService.deployStack(stackName, composeContent);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error deploying stack:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to deploy stack',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
