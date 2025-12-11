import { NextRequest, NextResponse } from 'next/server';
import { CommandService } from '@/lib/services/command-service';

const commandService = new CommandService();

/**
 * POST /api/containers/:id/shell - Execute shell command in container
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Command is required',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }

    const result = await commandService.executeContainerCommand(
      params.id,
      command
    );
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error executing container command:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to execute command',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
