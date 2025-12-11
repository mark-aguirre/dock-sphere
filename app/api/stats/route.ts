import { NextResponse } from 'next/server';
import { StatsService } from '@/lib/services/stats-service';

const statsService = new StatsService();

/**
 * GET /api/stats/aggregate - Get aggregate stats
 */
export async function GET() {
  try {
    const stats = await statsService.getAggregateStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error getting aggregate stats:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to get aggregate stats',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
