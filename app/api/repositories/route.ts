import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RepositoryService } from '@/lib/services/supabase-repository-service';

// GET /api/repositories - Get all repositories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const search = searchParams.get('search');
    const withStats = searchParams.get('withStats') === 'true';

    let repositories;

    if (search) {
      repositories = await RepositoryService.search(search);
    } else if (provider) {
      repositories = await RepositoryService.getByProvider(provider as 'github' | 'gitlab');
    } else if (withStats) {
      repositories = await RepositoryService.getAllWithStats();
    } else {
      repositories = await RepositoryService.getAll();
    }

    return NextResponse.json(repositories);
  } catch (error: any) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

// POST /api/repositories - Create a new repository
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const required = ['provider', 'name', 'fullName', 'defaultBranch', 'repositoryUrl'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if repository already exists
    const exists = await RepositoryService.exists(body.fullName, body.provider);
    if (exists) {
      return NextResponse.json(
        { error: 'Repository already exists' },
        { status: 409 }
      );
    }

    const repository = await RepositoryService.create({
      provider: body.provider,
      name: body.name,
      fullName: body.fullName,
      defaultBranch: body.defaultBranch,
      dockerfilePath: body.dockerfilePath || 'Dockerfile',
      repositoryUrl: body.repositoryUrl,
    });

    return NextResponse.json(repository, { status: 201 });
  } catch (error: any) {
    console.error('Error creating repository:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create repository' },
      { status: 500 }
    );
  }
}
