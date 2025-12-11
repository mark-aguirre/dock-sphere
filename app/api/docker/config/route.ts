import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      platform: process.platform,
      socketPath: process.platform === 'win32' 
        ? '//./pipe/docker_engine' 
        : process.env.DOCKER_SOCKET || '/var/run/docker.sock',
      envVar: process.env.DOCKER_SOCKET || 'not set',
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting Docker config:', error);
    return NextResponse.json(
      { error: 'Failed to get Docker configuration' },
      { status: 500 }
    );
  }
}
