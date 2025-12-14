import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOAuthConfigForUI, saveOAuthConfig } from '@/lib/oauth-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getOAuthConfigForUI();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching OAuth config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OAuth configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await request.json();
    await saveOAuthConfig(config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving OAuth config:', error);
    return NextResponse.json(
      { error: 'Failed to save OAuth configuration' },
      { status: 500 }
    );
  }
}
