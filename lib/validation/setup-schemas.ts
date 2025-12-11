import { z } from 'zod';

/**
 * Zod validation schemas for setup configuration
 */

// Docker configuration schema
export const dockerConfigSchema = z.object({
  socket: z.string().min(1, 'Docker socket path is required'),
});

// Auth configuration schema
export const authConfigSchema = z.object({
  nextAuthUrl: z.string().url('Must be a valid URL'),
  nextAuthSecret: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
});

// OAuth provider schema
export const oauthProviderSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  callbackUrl: z.string().url('Must be a valid callback URL').optional(),
});

// OAuth configuration schema
export const oauthConfigSchema = z.object({
  google: oauthProviderSchema.optional(),
  github: oauthProviderSchema.optional(),
  gitlab: oauthProviderSchema.optional(),
}).refine(
  (data) => data.google || data.github || data.gitlab,
  {
    message: 'At least one OAuth provider must be configured',
    path: ['oauth'],
  }
);

// Database configuration schema
export const databaseConfigSchema = z.object({
  url: z.string().regex(
    /^postgresql:\/\/.*$/,
    'Must be a valid PostgreSQL connection string'
  ),
  supabaseUrl: z.string().url('Must be a valid Supabase URL'),
  supabaseAnonKey: z.string().min(1, 'Supabase anonymous key is required'),
  supabaseServiceKey: z.string().min(1, 'Supabase service key is required'),
});

// Application configuration schema
export const applicationConfigSchema = z.object({
  appUrl: z.string().url('Must be a valid application URL'),
  adminEmails: z.array(z.string().email('Must be a valid email address'))
    .min(1, 'At least one admin email is required'),
});

// Logging configuration schema
export const loggingConfigSchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR'], {
    errorMap: () => ({ message: 'Log level must be DEBUG, INFO, WARN, or ERROR' }),
  }),
  enableRequestLogging: z.boolean(),
  enablePerformanceLogging: z.boolean(),
  enableDockerLogging: z.boolean(),
  format: z.enum(['json', 'pretty'], {
    errorMap: () => ({ message: 'Log format must be json or pretty' }),
  }),
  maxLogSize: z.number().positive('Max log size must be positive'),
  retentionDays: z.number().positive('Retention days must be positive'),
});

// Complete setup configuration schema
export const setupConfigSchema = z.object({
  docker: dockerConfigSchema,
  auth: authConfigSchema,
  oauth: oauthConfigSchema,
  database: databaseConfigSchema,
  application: applicationConfigSchema,
  logging: loggingConfigSchema,
});

// Form data schema (includes optional fields for form handling)
export const setupFormSchema = setupConfigSchema.extend({
  confirmPassword: z.string().optional(),
  testConnection: z.boolean().optional(),
});

// Partial schemas for step-by-step validation
export const dockerStepSchema = z.object({
  docker: dockerConfigSchema,
});

export const authStepSchema = z.object({
  auth: authConfigSchema,
});

export const oauthStepSchema = z.object({
  oauth: oauthConfigSchema,
});

export const databaseStepSchema = z.object({
  database: databaseConfigSchema,
});

export const applicationStepSchema = z.object({
  application: applicationConfigSchema,
});

export const loggingStepSchema = z.object({
  logging: loggingConfigSchema,
});

// Validation result helpers
export const createValidationError = (field: string, message: string, code: string = 'VALIDATION_ERROR') => ({
  field,
  message,
  code,
});

export const formatZodErrors = (error: z.ZodError) => {
  const errors: Record<string, Array<{ field: string; message: string; code: string }>> = {};
  
  error.errors.forEach((err) => {
    const field = err.path.join('.');
    const section = err.path[0] as string;
    
    if (!errors[section]) {
      errors[section] = [];
    }
    
    errors[section].push({
      field,
      message: err.message,
      code: err.code,
    });
  });
  
  return errors;
};

// Type exports for use in components
export type SetupConfigInput = z.input<typeof setupConfigSchema>;
export type SetupConfigOutput = z.output<typeof setupConfigSchema>;
export type SetupFormInput = z.input<typeof setupFormSchema>;
export type SetupFormOutput = z.output<typeof setupFormSchema>;