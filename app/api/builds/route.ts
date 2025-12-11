import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { buildService } from '@/lib/services/build-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const builds = await buildService.listBuilds();
    return NextResponse.json({ builds });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'BUILD_LIST_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const build = await buildService.buildImage(body);
    
    return NextResponse.json({ build });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'BUILD_ERROR' } },
      { status: 500 }
    );
  }
}
