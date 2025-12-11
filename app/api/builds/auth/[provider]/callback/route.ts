import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { buildService } from '@/lib/services/build-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/builds?error=no_code', request.url));
    }

    await buildService.handleAuthCallback(params.provider, code);
    return NextResponse.redirect(new URL('/builds?success=authenticated', request.url));
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(`/builds?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
