import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UserService } from './database';
import { logger } from './logger';

/**
 * Check if the current user is authenticated and registered
 */
export async function getAuthenticatedUser() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // Check if user is registered and active in database
    const isRegistered = await UserService.isUserRegistered(session.user.email);
    
    if (!isRegistered) {
      logger.warn('Unregistered user attempted access:', { 
        email: session.user.email 
      });
      return null;
    }

    // Update last login
    await UserService.updateLastLogin(session.user.email);

    return session.user;
  } catch (error) {
    logger.error('Error in getAuthenticatedUser:', { error });
    return null;
  }
}

/**
 * Middleware helper to check if user is registered
 */
export async function isUserAuthorized(email: string): Promise<boolean> {
  if (!email) {
    return false;
  }

  return await UserService.isUserRegistered(email);
}

/**
 * Get user session with registration check
 */
export async function getValidatedSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return { session: null, isRegistered: false };
  }

  const isRegistered = await UserService.isUserRegistered(session.user.email);
  
  return { 
    session: isRegistered ? session : null, 
    isRegistered 
  };
}