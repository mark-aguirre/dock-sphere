import { SetupConfiguration, ValidationResult, ConnectionTestResult, OAuthProviderConfig } from '@/types/setup-config';
import { setupConfigSchema, formatZodErrors } from '@/lib/validation/setup-schemas';
import { ValidationError, ConnectionError, createSetupError, ERROR_CODES } from '@/lib/errors/setup-errors';
import { isValidEmail, isValidUrl } from '@/lib/utils/setup-utils';

/**
 * Configuration Service
 * Handles validation and connection testing for setup configurations
 */

export class ConfigurationService {
  /**
   * Validate complete configuration
   */
  async validateConfiguration(config: Partial<SetupConfiguration>): Promise<ValidationResult> {
    try {
      setupConfigSchema.parse(config);
      return {
        isValid: true,
        errors: {},
        warnings: {},
      };
    } catch (error: any) {
      const formattedErrors = formatZodErrors(error);
      return {
        isValid: false,
        errors: formattedErrors,
        warnings: {},
      };
    }
  }

  /**
   * Validate OAuth provider configuration
   */
  validateOAuthProvider(
    provider: 'google' | 'github' | 'gitlab',
    config: OAuthProviderConfig
  ): ValidationResult {
    const errors: Record<string, Array<{ field: string; message: string; code: string }>> = {};
    const warnings: Record<string, Array<{ field: string; message: string; code: string }>> = {};

    // Validate client ID
    if (!config.clientId || config.clientId.trim().length === 0) {
      if (!errors[provider]) errors[provider] = [];
      errors[provider].push({
        field: 'clientId',
        message: 'Client ID is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else {
      // Provider-specific client ID validation
      if (provider === 'google' && !config.clientId.includes('.apps.googleusercontent.com')) {
        if (!warnings[provider]) warnings[provider] = [];
        warnings[provider].push({
          field: 'clientId',
          message: 'Google Client ID should end with .apps.googleusercontent.com',
          code: 'INVALID_FORMAT',
        });
      }
      
      if (provider === 'github' && config.clientId.length < 20) {
        if (!warnings[provider]) warnings[provider] = [];
        warnings[provider].push({
          field: 'clientId',
          message: 'GitHub Client ID seems too short',
          code: 'INVALID_FORMAT',
        });
      }
    }

    // Validate client secret
    if (!config.clientSecret || config.clientSecret.trim().length === 0) {
      if (!errors[provider]) errors[provider] = [];
      errors[provider].push({
        field: 'clientSecret',
        message: 'Client Secret is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else {
      // Provider-specific client secret validation
      if (provider === 'google' && !config.clientSecret.startsWith('GOCSPX-')) {
        if (!warnings[provider]) warnings[provider] = [];
        warnings[provider].push({
          field: 'clientSecret',
          message: 'Google Client Secret should start with GOCSPX-',
          code: 'INVALID_FORMAT',
        });
      }
    }

    // Validate callback URL if provided
    if (config.callbackUrl && !isValidUrl(config.callbackUrl)) {
      if (!errors[provider]) errors[provider] = [];
      errors[provider].push({
        field: 'callbackUrl',
        message: 'Callback URL must be a valid URL',
        code: ERROR_CODES.INVALID_FORMAT,
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate database configuration
   */
  validateDatabaseConfiguration(config: {
    url: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
  }): ValidationResult {
    const errors: Record<string, Array<{ field: string; message: string; code: string }>> = {};
    const warnings: Record<string, Array<{ field: string; message: string; code: string }>> = {};

    // Validate database URL
    if (!config.url) {
      errors.database = errors.database || [];
      errors.database.push({
        field: 'url',
        message: 'Database URL is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else if (!config.url.startsWith('postgresql://')) {
      errors.database = errors.database || [];
      errors.database.push({
        field: 'url',
        message: 'Database URL must be a PostgreSQL connection string',
        code: ERROR_CODES.INVALID_FORMAT,
      });
    }

    // Validate Supabase URL
    if (!config.supabaseUrl) {
      errors.database = errors.database || [];
      errors.database.push({
        field: 'supabaseUrl',
        message: 'Supabase URL is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else if (!isValidUrl(config.supabaseUrl)) {
      errors.database = errors.database || [];
      errors.database.push({
        field: 'supabaseUrl',
        message: 'Supabase URL must be a valid URL',
        code: ERROR_CODES.INVALID_FORMAT,
      });
    } else if (!config.supabaseUrl.includes('.supabase.co')) {
      warnings.database = warnings.database || [];
      warnings.database.push({
        field: 'supabaseUrl',
        message: 'Supabase URL should contain .supabase.co',
        code: 'INVALID_FORMAT',
      });
    }

    // Validate Supabase anonymous key
    if (!config.supabaseAnonKey) {
      errors.database = errors.database || [];
      errors.database.push({
        field: 'supabaseAnonKey',
        message: 'Supabase anonymous key is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else if (!config.supabaseAnonKey.startsWith('eyJ')) {
      warnings.database = warnings.database || [];
      warnings.database.push({
        field: 'supabaseAnonKey',
        message: 'Supabase anonymous key should be a JWT token',
        code: 'INVALID_FORMAT',
      });
    }

    // Validate Supabase service key
    if (!config.supabaseServiceKey) {
      errors.database = errors.database || [];
      errors.database.push({
        field: 'supabaseServiceKey',
        message: 'Supabase service key is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else if (!config.supabaseServiceKey.startsWith('eyJ') && !config.supabaseServiceKey.startsWith('sb_secret_')) {
      warnings.database = warnings.database || [];
      warnings.database.push({
        field: 'supabaseServiceKey',
        message: 'Supabase service key should be a JWT token or start with sb_secret_',
        code: 'INVALID_FORMAT',
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate email addresses
   */
  validateEmailAddresses(emails: string[]): ValidationResult {
    const errors: Record<string, Array<{ field: string; message: string; code: string }>> = {};
    const warnings: Record<string, Array<{ field: string; message: string; code: string }>> = {};

    if (emails.length === 0) {
      errors.application = errors.application || [];
      errors.application.push({
        field: 'adminEmails',
        message: 'At least one admin email is required',
        code: ERROR_CODES.REQUIRED_FIELD,
      });
    } else {
      emails.forEach((email, index) => {
        if (!isValidEmail(email)) {
          errors.application = errors.application || [];
          errors.application.push({
            field: `adminEmails[${index}]`,
            message: `Invalid email format: ${email}`,
            code: ERROR_CODES.INVALID_FORMAT,
          });
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test OAuth provider connection
   */
  async testOAuthConnection(
    provider: 'google' | 'github' | 'gitlab',
    config: OAuthProviderConfig
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // First validate the configuration
      const validation = this.validateOAuthProvider(provider, config);
      if (!validation.isValid) {
        return {
          service: provider,
          status: 'error',
          message: 'Configuration validation failed',
          details: validation.errors,
          timestamp: new Date(),
        };
      }

      // Test the OAuth endpoint
      const result = await this.performOAuthTest(provider, config);
      
      return {
        service: provider,
        status: result.success ? 'success' : 'error',
        message: result.message,
        details: {
          responseTime: Date.now() - startTime,
          ...result.details,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: provider,
        status: 'error',
        message: `Connection test failed: ${(error as Error).message}`,
        details: {
          responseTime: Date.now() - startTime,
          error: error,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(config: {
    url: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
  }): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // First validate the configuration
      const validation = this.validateDatabaseConfiguration(config);
      if (!validation.isValid) {
        return {
          service: 'database',
          status: 'error',
          message: 'Database configuration validation failed',
          details: validation.errors,
          timestamp: new Date(),
        };
      }

      // Test Supabase connection by checking the REST API health
      const healthUrl = `${config.supabaseUrl}/rest/v1/`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'apikey': config.supabaseAnonKey,
          'Authorization': `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // For Supabase, we expect either a 200 (success) or 404 (no tables, but connection works)
      if (response.ok || response.status === 404) {
        return {
          service: 'database',
          status: 'success',
          message: 'Supabase connection successful',
          details: {
            responseTime: Date.now() - startTime,
            supabaseUrl: config.supabaseUrl,
            httpStatus: response.status,
          },
          timestamp: new Date(),
        };
      } else if (response.status === 401) {
        return {
          service: 'database',
          status: 'error',
          message: 'Invalid Supabase API key - check your anonymous key',
          details: {
            responseTime: Date.now() - startTime,
            httpStatus: response.status,
          },
          timestamp: new Date(),
        };
      } else {
        return {
          service: 'database',
          status: 'error',
          message: `Supabase connection failed: HTTP ${response.status} ${response.statusText}`,
          details: {
            responseTime: Date.now() - startTime,
            httpStatus: response.status,
          },
          timestamp: new Date(),
        };
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          service: 'database',
          status: 'error',
          message: 'Database connection timed out',
          details: {
            responseTime: Date.now() - startTime,
            timeout: true,
          },
          timestamp: new Date(),
        };
      }

      return {
        service: 'database',
        status: 'error',
        message: `Database connection failed: ${(error as Error).message}`,
        details: {
          responseTime: Date.now() - startTime,
          error: (error as Error).message,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test all connections in configuration
   */
  async testAllConnections(config: Partial<SetupConfiguration>): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    // Test OAuth providers
    if (config.oauth?.google) {
      results.push(await this.testOAuthConnection('google', config.oauth.google));
    }
    if (config.oauth?.github) {
      results.push(await this.testOAuthConnection('github', config.oauth.github));
    }
    if (config.oauth?.gitlab) {
      results.push(await this.testOAuthConnection('gitlab', config.oauth.gitlab));
    }

    // Test database connection
    if (config.database) {
      results.push(await this.testDatabaseConnection(config.database));
    }

    return results;
  }

  /**
   * Perform OAuth provider-specific connection test
   */
  private async performOAuthTest(
    provider: 'google' | 'github' | 'gitlab',
    config: OAuthProviderConfig
  ): Promise<{ success: boolean; message: string; details?: any }> {
    const timeout = 10000; // 10 seconds

    try {
      let testUrl: string;
      let expectedResponse: string;

      switch (provider) {
        case 'google':
          testUrl = `https://oauth2.googleapis.com/tokeninfo?client_id=${config.clientId}`;
          expectedResponse = 'error'; // Google returns error for invalid client_id
          break;
        case 'github':
          testUrl = 'https://api.github.com/user';
          expectedResponse = 'message'; // GitHub returns message for unauthorized
          break;
        case 'gitlab':
          testUrl = 'https://gitlab.com/api/v4/user';
          expectedResponse = 'message'; // GitLab returns message for unauthorized
          break;
        default:
          throw new Error(`Unsupported OAuth provider: ${provider}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Container-Hub-Plus-Setup',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // For OAuth testing, we expect certain error responses that indicate the service is reachable
      if (provider === 'google') {
        // Google should return 400 for invalid client_id, which means the service is reachable
        return {
          success: response.status === 400,
          message: response.status === 400 
            ? 'Google OAuth service is reachable' 
            : `Unexpected response: ${response.status}`,
          details: { status: response.status },
        };
      } else {
        // GitHub/GitLab should return 401 for unauthorized, which means the service is reachable
        return {
          success: response.status === 401,
          message: response.status === 401 
            ? `${provider} OAuth service is reachable` 
            : `Unexpected response: ${response.status}`,
          details: { status: response.status },
        };
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          message: 'Connection test timed out',
          details: { timeout: true },
        };
      }
      
      return {
        success: false,
        message: `Connection test failed: ${(error as Error).message}`,
        details: { error },
      };
    }
  }
}

// Export singleton instance
export const configurationService = new ConfigurationService();