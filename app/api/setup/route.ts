import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/database';
import { logger } from '@/lib/logger';

// This is a one-time setup endpoint to register initial admin users
// You can disable this after initial setup for security

const INITIAL_ADMIN_USERS = [
  {
    email: 'marksomerson.aguirre@gmail.com',
    name: 'Mark Somerson Aguirre',
  },
  // Add other initial admin users here
];

export async function POST(request: NextRequest) {
  try {
    const results = [];

    for (const adminUser of INITIAL_ADMIN_USERS) {
      try {
        // Check if user already exists
        const existingUser = await UserService.getUserByEmail(adminUser.email);
        
        if (existingUser) {
          results.push({
            email: adminUser.email,
            status: 'already_exists',
            message: 'User already registered'
          });
          continue;
        }

        // Register the admin user
        const newUser = await UserService.upsertUser({
          id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: adminUser.email,
          name: adminUser.name,
        });

        if (newUser) {
          results.push({
            email: adminUser.email,
            status: 'created',
            message: 'Admin user registered successfully'
          });
          
          logger.info('Initial admin user registered:', { 
            email: adminUser.email 
          });
        } else {
          results.push({
            email: adminUser.email,
            status: 'error',
            message: 'Failed to register user'
          });
        }
      } catch (error) {
        logger.error('Error registering admin user:', { 
          email: adminUser.email, 
          error 
        });
        
        results.push({
          email: adminUser.email,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      message: 'Setup completed',
      results 
    });
  } catch (error) {
    logger.error('Error in setup endpoint:', { error });
    return NextResponse.json(
      { error: 'Setup failed' }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check setup status
export async function GET() {
  try {
    const results = [];

    for (const adminUser of INITIAL_ADMIN_USERS) {
      const existingUser = await UserService.getUserByEmail(adminUser.email);
      results.push({
        email: adminUser.email,
        registered: !!existingUser,
        active: existingUser?.is_active || false
      });
    }

    return NextResponse.json({ 
      message: 'Setup status',
      admin_users: results 
    });
  } catch (error) {
    logger.error('Error checking setup status:', { error });
    return NextResponse.json(
      { error: 'Failed to check setup status' }, 
      { status: 500 }
    );
  }
}