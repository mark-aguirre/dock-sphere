import { NextResponse } from 'next/server';

/**
 * GET /api/commands - Get command execution status
 */
export async function GET() {
  return NextResponse.json({
    message: 'Command API - use /api/commands/execute to execute commands'
  });
}
