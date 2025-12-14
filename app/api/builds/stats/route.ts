import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BuildService } from '@/lib/services/supabase-build-service';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/builds/stats - Get build statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get('repositoryId');

    let stats;
    if (repositoryId) {
      stats = await BuildService.getStatsByRepository(repositoryId);
    } else {
      stats = await BuildService.getStats();
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching build stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch build statistics' },
      { status: 500 }
    );
  }
}
