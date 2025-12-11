import { NextRequest, NextResponse } from 'next/server';
import { environmentManager } from '@/lib/services/environment-manager';
import { formatErrorResponse, logSetupError } from '@/lib/errors/setup-errors';

/**
 * Configuration Backup API Endpoints
 * Handles backup creation, listing, and restoration
 */

// GET: List available backups
export async function GET(request: NextRequest) {
  try {
    const backups = await environmentManager.listBackups();
    
    return NextResponse.json({
      success: true,
      backups: backups.map(backup => ({
        id: backup.id,
        timestamp: backup.timestamp,
        description: backup.description,
      })),
      count: backups.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorResponse = logSetupError(error, 'GET /api/setup/backup');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST: Create new backup or restore from backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, backupId, description } = body;

    if (!action || !['create', 'restore'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Must be create or restore',
      }, { status: 400 });
    }

    if (action === 'create') {
      const newBackupId = await environmentManager.createBackup(description);
      
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backupId: newBackupId,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'restore') {
      if (!backupId) {
        return NextResponse.json({
          success: false,
          message: 'Backup ID is required for restore action',
        }, { status: 400 });
      }

      await environmentManager.restoreFromBackup(backupId);
      
      return NextResponse.json({
        success: true,
        message: 'Configuration restored from backup',
        backupId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const errorResponse = logSetupError(error, 'POST /api/setup/backup');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}