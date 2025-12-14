import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildService } from '@/lib/services/build-service';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repositories = await buildService.listRepositories();
    return NextResponse.json({ repositories });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'REPOSITORY_LIST_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const repository = await buildService.connectRepository(body);
    
    return NextResponse.json({ repository });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'REPOSITORY_CONNECT_ERROR' } },
      { status: 500 }
    );
  }
}
