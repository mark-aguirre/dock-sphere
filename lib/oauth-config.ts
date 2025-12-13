import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'default-key-change-me';

interface OAuthConfig {
  github?: {
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
  gitlab?: {
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
}

// Simple encryption for stored credentials
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
    // Decryption error
    return '';
  }
}

export async function getOAuthConfig(): Promise<OAuthConfig> {
  // First check environment variables (backward compatibility)
  const envConfig: OAuthConfig = {};
  
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    envConfig.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      enabled: true,
    };
  }
  
  if (process.env.GITLAB_CLIENT_ID && process.env.GITLAB_CLIENT_SECRET) {
    envConfig.gitlab = {
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      enabled: true,
    };
  }

  // Then check Supabase (overrides env)
  try {
    const { data: providers, error } = await supabaseAdmin
      .from('OAuthProvider')
      .select('*')
      .in('provider', ['github', 'gitlab']);

    if (error) {
      console.error('[OAuthConfig] Supabase query error:', error);
      throw error;
    }

    console.log('[OAuthConfig] Supabase query successful, providers:', providers?.length || 0);

    const dbConfig: OAuthConfig = {};

    if (providers) {
      for (const provider of providers) {
        const decryptedSecret = decrypt(provider.clientSecret);
        
        // Only use database config if it has actual values (not empty defaults)
        const hasValidConfig = provider.clientId && provider.clientId !== '' && provider.enabled;
        
        if (provider.provider === 'github' && hasValidConfig) {
          console.log('[OAuthConfig] Found valid GitHub config in database');
          dbConfig.github = {
            clientId: provider.clientId,
            clientSecret: decryptedSecret,
            enabled: provider.enabled,
          };
        } else if (provider.provider === 'gitlab' && hasValidConfig) {
          console.log('[OAuthConfig] Found valid GitLab config in database');
          dbConfig.gitlab = {
            clientId: provider.clientId,
            clientSecret: decryptedSecret,
            enabled: provider.enabled,
          };
        }
      }
    }

    // Merge configs: database overrides env only if database has valid values
    const finalConfig = { ...envConfig, ...dbConfig };
    console.log('[OAuthConfig] Final config:', {
      hasGithub: !!finalConfig.github,
      hasGitlab: !!finalConfig.gitlab,
      githubEnabled: finalConfig.github?.enabled,
      gitlabEnabled: finalConfig.gitlab?.enabled,
    });
    
    return finalConfig;
  } catch (error) {
    console.error('[OAuthConfig] Error reading OAuth config from Supabase:', error);
    console.log('[OAuthConfig] Falling back to environment config');
    return envConfig;
  }
}

export async function saveOAuthConfig(config: OAuthConfig): Promise<void> {
  try {
    // Save GitHub config
    if (config.github) {
      const encryptedSecret = config.github.clientSecret && config.github.clientSecret !== '••••••••'
        ? encrypt(config.github.clientSecret)
        : undefined;

      const { data: existing } = await supabaseAdmin
        .from('OAuthProvider')
        .select('*')
        .eq('provider', 'github')
        .single();

      if (existing) {
        // Update
        const updateData: any = {
          clientId: config.github.clientId,
          enabled: config.github.enabled,
        };
        if (encryptedSecret) {
          updateData.clientSecret = encryptedSecret;
        }
        
        await supabaseAdmin
          .from('OAuthProvider')
          .update(updateData)
          .eq('provider', 'github');
      } else {
        // Insert
        await supabaseAdmin
          .from('OAuthProvider')
          .insert({
            provider: 'github',
            clientId: config.github.clientId,
            clientSecret: encryptedSecret || '',
            enabled: config.github.enabled,
          });
      }
    }

    // Save GitLab config
    if (config.gitlab) {
      const encryptedSecret = config.gitlab.clientSecret && config.gitlab.clientSecret !== '••••••••'
        ? encrypt(config.gitlab.clientSecret)
        : undefined;

      const { data: existing } = await supabaseAdmin
        .from('OAuthProvider')
        .select('*')
        .eq('provider', 'gitlab')
        .single();

      if (existing) {
        // Update
        const updateData: any = {
          clientId: config.gitlab.clientId,
          enabled: config.gitlab.enabled,
        };
        if (encryptedSecret) {
          updateData.clientSecret = encryptedSecret;
        }
        
        await supabaseAdmin
          .from('OAuthProvider')
          .update(updateData)
          .eq('provider', 'gitlab');
      } else {
        // Insert
        await supabaseAdmin
          .from('OAuthProvider')
          .insert({
            provider: 'gitlab',
            clientId: config.gitlab.clientId,
            clientSecret: encryptedSecret || '',
            enabled: config.gitlab.enabled,
          });
      }
    }
  } catch (error) {
    console.error('Error saving OAuth config to Supabase:', error);
    throw error;
  }
}

export async function getOAuthConfigForUI(): Promise<OAuthConfig> {
  const config = await getOAuthConfig();
  
  // Mask secrets for UI display
  if (config.github?.clientSecret) {
    config.github.clientSecret = '••••••••';
  }
  if (config.gitlab?.clientSecret) {
    config.gitlab.clientSecret = '••••••••';
  }
  
  return config;
}
