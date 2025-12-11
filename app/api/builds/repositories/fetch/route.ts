import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { buildService } from '@/lib/services/build-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'github';

    console.log(`[FetchRepositories] Fetching repositories for provider: ${provider}`);
    const repositories = await buildService.fetchRepositories(provider as 'github' | 'gitlab');
    console.log(`[FetchRepositories] Found ${repositories.length} repositories`);
    return NextResponse.json({ repositories });
  } catch (error: any) {
    console.error('[FetchRepositories] Error:', error);
    return NextResponse.json(
      { error: { message: error.message, code: 'FETCH_REPOSITORIES_ERROR', stack: error.stack } },
      { status: 500 }
    );
  }
}
