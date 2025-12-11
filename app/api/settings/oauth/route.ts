import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getOAuthConfigForUI, saveOAuthConfig } from '@/lib/oauth-config';

export async function GET() {
  try {
    const session = await getServerSession();
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
    const session = await getServerSession();
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
