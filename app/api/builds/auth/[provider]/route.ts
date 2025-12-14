import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildService } from '@/lib/services/build-service';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticated = await buildService.checkAuthentication(params.provider);
    return NextResponse.json({ authenticated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'AUTH_CHECK_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[AUTH] Getting auth URL for provider: ${params.provider}`);
    const authUrl = await buildService.getAuthUrl(params.provider);
    console.log(`[AUTH] Auth URL generated successfully`);
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error(`[AUTH] Error getting auth URL:`, error);
    return NextResponse.json(
      { error: { message: error.message, code: 'AUTH_URL_ERROR', stack: error.stack } },
      { status: 500 }
    );
  }
}
