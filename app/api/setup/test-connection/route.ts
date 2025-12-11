import { NextRequest, NextResponse } from 'next/server';
import { configurationService } from '@/lib/services/configuration-service';
import { formatErrorResponse, logSetupError } from '@/lib/errors/setup-errors';

/**
 * Connection Testing API Endpoint
 * Tests OAuth and database connections
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, config, type } = body;

    if (!type || !config) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: type and config',
      }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'oauth':
        if (!provider || !['google', 'github', 'gitlab'].includes(provider)) {
          return NextResponse.json({
            success: false,
            message: 'Invalid OAuth provider. Must be google, github, or gitlab',
          }, { status: 400 });
        }
        result = await configurationService.testOAuthConnection(provider, config);
        break;

      case 'database':
        result = await configurationService.testDatabaseConnection(config);
        break;

      case 'all':
        const results = await configurationService.testAllConnections(config);
        return NextResponse.json({
          success: true,
          results,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid connection type. Must be oauth, database, or all',
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorResponse = logSetupError(error, 'POST /api/setup/test-connection');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}