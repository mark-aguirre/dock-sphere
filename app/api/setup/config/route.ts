import { NextRequest, NextResponse } from 'next/server';
import { environmentManager } from '@/lib/services/environment-manager';
import { configurationService } from '@/lib/services/configuration-service';
import { setupConfigSchema } from '@/lib/validation/setup-schemas';
import { formatErrorResponse, logSetupError } from '@/lib/errors/setup-errors';
import { sanitizeConfigurationForLogging, sanitizeConfigurationForUI, mergeConfigurationPreservingSecrets } from '@/lib/utils/setup-utils';
import { adjustConfigForDocker, isDockerEnvironment } from '@/lib/utils/docker-config';
import { SetupConfiguration } from '@/types/setup-config';

/**
 * Setup Configuration API Endpoints
 * Handles CRUD operations for environment configuration
 */

// GET: Retrieve current configuration status
export async function GET(request: NextRequest) {
  try {
    const currentConfig = await environmentManager.readEnvironment();
    const validation = await configurationService.validateConfiguration(currentConfig);
    const environmentValidation = await environmentManager.validateEnvironment();

    // Sanitize sensitive data for UI display
    const sanitizedConfig = sanitizeConfigurationForUI(currentConfig);

    return NextResponse.json({
      success: true,
      configuration: sanitizedConfig,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      environment: {
        isValid: environmentValidation.isValid,
        conflicts: environmentValidation.conflicts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorResponse = logSetupError(error, 'GET /api/setup/config');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST: Save new configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current configuration to preserve existing secrets
    const currentConfig = await environmentManager.readEnvironment();
    
    // Merge configurations, preserving existing secrets when placeholders are sent
    const mergedConfig = mergeConfigurationPreservingSecrets(body, currentConfig);
    
    // Ensure required fields have defaults if missing
    if (!mergedConfig.docker?.socket) {
      mergedConfig.docker = {
        socket: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'
      };
    }
    
    // Validate the merged configuration
    const validation = await configurationService.validateConfiguration(mergedConfig);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Configuration validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      }, { status: 400 });
    }

    // Parse and validate with Zod schema
    const config = setupConfigSchema.parse(mergedConfig);

    // Adjust configuration for Docker environment if needed
    const finalConfig = adjustConfigForDocker(config as any);

    // Test connections if requested (skip in Docker for faster setup)
    if (body.testConnection !== false && !isDockerEnvironment()) {
      const connectionResults = await configurationService.testAllConnections(finalConfig as any);
      const failedConnections = connectionResults.filter(result => result.status === 'error');
      
      if (failedConnections.length > 0 && body.forceSkipConnectionTests !== true) {
        return NextResponse.json({
          success: false,
          message: 'Connection tests failed. You can skip connection tests and save anyway if needed.',
          connectionResults,
          canSkipTests: true,
          errors: {
            connections: failedConnections.map(result => ({
              field: result.service,
              message: result.message,
              code: 'CONNECTION_FAILED',
            })),
          },
        }, { status: 400 });
      }
    }

    // Save the configuration
    try {
      await environmentManager.writeEnvironment(finalConfig as any);
    } catch (error) {
      // In Docker, if file writing fails due to permissions, we can still proceed
      // since the configuration is handled via environment variables
      if (isDockerEnvironment() && (error as any).message?.includes('Permission denied')) {
        console.log('[Setup API] File write failed in Docker, but configuration is handled via environment variables');
      } else {
        throw error; // Re-throw if it's not a Docker permission issue
      }
    }

    const dockerNote = isDockerEnvironment() ? ' (Docker environment - configuration managed via environment variables)' : '';
    console.log(`[Setup API] Configuration saved successfully${dockerNote}`);

    return NextResponse.json({
      success: true,
      message: `Configuration saved successfully${dockerNote}`,
      timestamp: new Date().toISOString(),
      isDocker: isDockerEnvironment(),
      note: isDockerEnvironment() ? 'Configuration is managed via Docker environment variables and will persist across container restarts.' : undefined,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        message: 'Configuration validation failed',
        errors: error.errors,
      }, { status: 400 });
    }

    const errorResponse = logSetupError(error, 'POST /api/setup/config');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT: Update existing configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current configuration
    const currentConfig = await environmentManager.readEnvironment();
    
    // Merge with updates
    const mergedConfig = {
      docker: { ...currentConfig.docker, ...body.docker },
      auth: { ...currentConfig.auth, ...body.auth },
      oauth: {
        ...currentConfig.oauth,
        ...body.oauth,
        google: { ...currentConfig.oauth?.google, ...body.oauth?.google },
        github: { ...currentConfig.oauth?.github, ...body.oauth?.github },
        gitlab: { ...currentConfig.oauth?.gitlab, ...body.oauth?.gitlab },
      },
      database: { ...currentConfig.database, ...body.database },
      application: { 
        ...currentConfig.application, 
        ...body.application,
        adminEmails: body.application?.adminEmails || currentConfig.application?.adminEmails || [],
      },
      logging: { ...currentConfig.logging, ...body.logging },
    };

    // Validate the merged configuration
    const validation = await configurationService.validateConfiguration(mergedConfig);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Updated configuration validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      }, { status: 400 });
    }

    // Parse and validate with Zod schema
    const config = setupConfigSchema.parse(mergedConfig);

    // Adjust configuration for Docker environment if needed
    const finalConfig = adjustConfigForDocker(config as any);

    // Test connections if requested (skip in Docker for faster setup)
    if (body.testConnection !== false && !isDockerEnvironment()) {
      const connectionResults = await configurationService.testAllConnections(finalConfig as any);
      const failedConnections = connectionResults.filter(result => result.status === 'error');
      
      if (failedConnections.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'Connection tests failed',
          connectionResults,
          errors: {
            connections: failedConnections.map(result => ({
              field: result.service,
              message: result.message,
              code: 'CONNECTION_FAILED',
            })),
          },
        }, { status: 400 });
      }
    }

    // Update the configuration
    await environmentManager.updateEnvironment(finalConfig as any);

    console.log('[Setup API] Configuration updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        message: 'Configuration validation failed',
        errors: error.errors,
      }, { status: 400 });
    }

    const errorResponse = logSetupError(error, 'PUT /api/setup/config');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE: Reset configuration to defaults
export async function DELETE(request: NextRequest) {
  try {
    // Create backup before reset
    const backupId = await environmentManager.createBackup('Pre-reset backup');
    
    // Get default configuration
    const { getDefaultConfiguration } = await import('@/lib/utils/setup-utils');
    const defaultConfig = getDefaultConfiguration();
    
    // Write default configuration
    await environmentManager.writeEnvironment(defaultConfig);

    console.log('[Setup API] Configuration reset to defaults');

    return NextResponse.json({
      success: true,
      message: 'Configuration reset to defaults',
      backupId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorResponse = logSetupError(error, 'DELETE /api/setup/config');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}