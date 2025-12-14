import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RepositoryService } from '@/lib/services/supabase-repository-service';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/repositories/[id] - Get a specific repository
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repository = await RepositoryService.getById(params.id);
    
    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json(repository);
  } catch (error: any) {
    console.error('Error fetching repository:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}

// PATCH /api/repositories/[id] - Update a repository
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const repository = await RepositoryService.update(params.id, body);
    return NextResponse.json(repository);
  } catch (error: any) {
    console.error('Error updating repository:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update repository' },
      { status: 500 }
    );
  }
}

// DELETE /api/repositories/[id] - Delete a repository
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await RepositoryService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting repository:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete repository' },
      { status: 500 }
    );
  }
}
