import { NextRequest, NextResponse } from 'next/server';
import { NetworkService } from '@/lib/services/network-service';
import { NetworkConfig } from '@/types/network';

const networkService = new NetworkService();

/**
 * GET /api/networks - List networks
 */
export async function GET() {
  try {
    const networks = await networkService.listNetworks();
    return NextResponse.json(networks);
  } catch (error: any) {
    console.error('Error listing networks:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to list networks',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/networks - Create network
 */
export async function POST(request: NextRequest) {
  try {
    const config: NetworkConfig = await request.json();
    const network = await networkService.createNetwork(config);
    return NextResponse.json(network, { status: 201 });
  } catch (error: any) {
    console.error('Error creating network:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to create network',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
