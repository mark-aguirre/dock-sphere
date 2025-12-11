import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { buildService } from '@/lib/services/build-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const details = await buildService.getRepositoryDetails(params.id);
    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'REPOSITORY_DETAILS_ERROR' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updated = await buildService.updateRepository(params.id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'REPOSITORY_UPDATE_ERROR' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await buildService.deleteRepository(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message, code: 'REPOSITORY_DELETE_ERROR' } },
      { status: 500 }
    );
  }
}
