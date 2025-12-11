/**
 * Setup system exports
 * Centralized exports for all setup-related functionality
 */

// Types
export * from '@/types/setup-config';

// Validation schemas
export * from '@/lib/validation/setup-schemas';

// Error handling
export { 
  ValidationError, 
  ConnectionError, 
  createSetupError, 
  formatErrorResponse, 
  logSetupError, 
  ERROR_CODES 
} from '@/lib/errors/setup-errors';

// Utilities
export * from '@/lib/utils/setup-utils';

// Re-export commonly used items with aliases for convenience
export type {
  SetupConfiguration as Config,
  ValidationResult as ValidationResult,
  ConnectionTestResult as TestResult,
  SetupError as Error,
} from '@/types/setup-config';

export {
  setupConfigSchema as configSchema,
  setupFormSchema as formSchema,
} from '@/lib/validation/setup-schemas';

export {
  createSetupError as createError,
  formatErrorResponse as formatError,
} from '@/lib/errors/setup-errors';