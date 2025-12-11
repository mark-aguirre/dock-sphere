import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { UserService } from '@/lib/database';
import { logger } from '@/lib/logger';

// Admin emails - you should move this to environment variables or database
const ADMIN_EMAILS = [
  'marksomerson.aguirre@gmail.com', // Your admin email
  'admin@yourdomain.com', // Replace with other admin emails
];

async function isAdmin(email: string): Promise<boolean> {
  return ADMIN_EMAILS.includes(email);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!await isAdmin(user.email)) {
      logger.warn('Non-admin user attempted to access user list:', { 
        email: user.email 
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await UserService.getAllActiveUsers();
    
    logger.info('Admin retrieved user list:', { 
      adminEmail: user.email, 
      userCount: users.length 
    });

    return NextResponse.json({ users });
  } catch (error) {
    logger.error('Error fetching users:', { error });
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!await isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, action } = body;

    if (!email || !action) {
      return NextResponse.json(
        { error: 'Email and action are required' }, 
        { status: 400 }
      );
    }

    if (action === 'register') {
      // Register a new user
      const newUser = await UserService.upsertUser({
        id: `manual_${Date.now()}`, // Generate a temporary ID
        email,
        name: name || email.split('@')[0],
      });

      if (!newUser) {
        return NextResponse.json(
          { error: 'Failed to register user' }, 
          { status: 500 }
        );
      }

      logger.info('Admin registered new user:', { 
        adminEmail: user.email, 
        newUserEmail: email 
      });

      return NextResponse.json({ 
        message: 'User registered successfully', 
        user: newUser 
      });
    }

    if (action === 'deactivate') {
      const success = await UserService.deactivateUser(email);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to deactivate user' }, 
          { status: 500 }
        );
      }

      logger.info('Admin deactivated user:', { 
        adminEmail: user.email, 
        deactivatedEmail: email 
      });

      return NextResponse.json({ message: 'User deactivated successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid action' }, 
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error in user management:', { error });
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}