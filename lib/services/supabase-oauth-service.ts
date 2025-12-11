import { supabase } from '../supabase';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'default-key-change-me';

interface OAuthProvider {
  id?: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  callbackUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Encryption helpers
function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  if (!text || text === '') return '';
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')),
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

export class OAuthService {
  // CREATE - Add a new OAuth provider
  static async create(provider: Omit<OAuthProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<OAuthProvider> {
    const encryptedSecret = encrypt(provider.clientSecret);
    
    const { data, error } = await supabase
      .from('OAuthProvider')
      .insert({
        provider: provider.provider,
        clientId: provider.clientId,
        clientSecret: encryptedSecret,
        enabled: provider.enabled,
        callbackUrl: provider.callbackUrl,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create OAuth provider: ${error.message}`);
    
    return {
      ...data,
      clientSecret: decrypt(data.clientSecret),
    };
  }

  // READ - Get all OAuth providers
  static async getAll(): Promise<OAuthProvider[]> {
    const { data, error } = await supabase
      .from('OAuthProvider')
      .select('*')
      .order('provider', { ascending: true });

    if (error) throw new Error(`Failed to fetch OAuth providers: ${error.message}`);
    
    return (data || []).map(provider => ({
      ...provider,
      clientSecret: decrypt(provider.clientSecret),
    }));
  }

  // READ - Get a single OAuth provider by provider name
  static async getByProvider(providerName: string): Promise<OAuthProvider | null> {
    const { data, error } = await supabase
      .from('OAuthProvider')
      .select('*')
      .eq('provider', providerName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch OAuth provider: ${error.message}`);
    }
    
    return {
      ...data,
      clientSecret: decrypt(data.clientSecret),
    };
  }

  // READ - Get enabled OAuth providers only
  static async getEnabled(): Promise<OAuthProvider[]> {
    const { data, error } = await supabase
      .from('OAuthProvider')
      .select('*')
      .eq('enabled', true)
      .order('provider', { ascending: true });

    if (error) throw new Error(`Failed to fetch enabled OAuth providers: ${error.message}`);
    
    return (data || []).map(provider => ({
      ...provider,
      clientSecret: decrypt(provider.clientSecret),
    }));
  }

  // UPDATE - Update an OAuth provider
  static async update(
    providerName: string,
    updates: Partial<Omit<OAuthProvider, 'id' | 'provider' | 'createdAt' | 'updatedAt'>>
  ): Promise<OAuthProvider> {
    const updateData: any = { ...updates };
    
    // Encrypt secret if provided and not masked
    if (updates.clientSecret && updates.clientSecret !== '••••••••') {
      updateData.clientSecret = encrypt(updates.clientSecret);
    } else {
      delete updateData.clientSecret; // Don't update if masked
    }

    const { data, error } = await supabase
      .from('OAuthProvider')
      .update(updateData)
      .eq('provider', providerName)
      .select()
      .single();

    if (error) throw new Error(`Failed to update OAuth provider: ${error.message}`);
    
    return {
      ...data,
      clientSecret: decrypt(data.clientSecret),
    };
  }

  // UPDATE - Enable/disable a provider
  static async toggleEnabled(providerName: string, enabled: boolean): Promise<OAuthProvider> {
    return this.update(providerName, { enabled });
  }

  // DELETE - Remove an OAuth provider
  static async delete(providerName: string): Promise<void> {
    const { error } = await supabase
      .from('OAuthProvider')
      .delete()
      .eq('provider', providerName);

    if (error) throw new Error(`Failed to delete OAuth provider: ${error.message}`);
  }

  // UPSERT - Create or update an OAuth provider
  static async upsert(provider: Omit<OAuthProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<OAuthProvider> {
    const existing = await this.getByProvider(provider.provider);
    
    if (existing) {
      return this.update(provider.provider, provider);
    } else {
      return this.create(provider);
    }
  }

  // Get masked version for UI display
  static async getAllMasked(): Promise<OAuthProvider[]> {
    const providers = await this.getAll();
    return providers.map(p => ({
      ...p,
      clientSecret: p.clientSecret ? '••••••••' : '',
    }));
  }
}
