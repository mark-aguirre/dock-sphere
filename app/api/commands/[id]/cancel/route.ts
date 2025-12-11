import { NextRequest, NextResponse } from 'next/server';
import { CommandService } from '@/lib/services/command-service';

const commandService = new CommandService();

/**
 * POST /api/commands/:id/cancel - Cancel command
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await commandService.cancelCommand(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Command cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling command:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to cancel command',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
