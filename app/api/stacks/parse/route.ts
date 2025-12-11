import { NextRequest, NextResponse } from 'next/server';
import { StackService } from '@/lib/services/stack-service';

const stackService = new StackService();

/**
 * POST /api/stacks/parse - Parse Compose file
 */
export async function POST(request: NextRequest) {
  try {
    const { composeContent } = await request.json();

    if (!composeContent) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Compose content is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    const parsed = await stackService.parseComposeFile(composeContent);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error parsing Compose file:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to parse Compose file',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
