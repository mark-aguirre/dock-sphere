import { supabaseAdmin } from './supabase';
import { logger } from './logger';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export class UserService {
  /**
   * Check if a user exists and is active in the database
   */
  static async isUserRegistered(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user not found
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking user registration:', { email, error });
      return false;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error fetching user by email:', { email, error });
      return null;
    }
  }

  /**
   * Create or update user in database
   */
  static async upsertUser(userData: {
    id: string;
    email: string;
    name: string;
    image?: string;
  }): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          image: userData.image,
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('User upserted successfully:', { email: userData.email });
      return data;
    } catch (error) {
      logger.error('Error upserting user:', { email: userData.email, error });
      return null;
    }
  }

  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(email: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        throw error;
      }

      logger.debug('Updated last login for user:', { email });
    } catch (error) {
      logger.error('Error updating last login:', { email, error });
    }
  }

  /**
   * Deactivate a user (soft delete)
   */
  static async deactivateUser(email: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        throw error;
      }

      logger.info('User deactivated:', { email });
      return true;
    } catch (error) {
      logger.error('Error deactivating user:', { email, error });
      return false;
    }
  }

  /**
   * Get all active users (admin function)
   */
  static async getAllActiveUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching all users:', { error });
      return [];
    }
  }
}