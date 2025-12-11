import { NextRequest, NextResponse } from 'next/server';
import { StatsService } from '@/lib/services/stats-service';

const statsService = new StatsService();

/**
 * GET /api/containers/:id/stats - Get container stats
 * Note: For real-time streaming, use WebSocket connection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint returns a message about WebSocket usage
    // Real-time stats should use WebSocket connection
    return NextResponse.json({
      message: 'Use WebSocket connection for real-time stats streaming',
      containerId: params.id,
      websocketEndpoint: '/api/ws/stats'
    });
  } catch (error: any) {
    console.error('Error with stats endpoint:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to get stats',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
