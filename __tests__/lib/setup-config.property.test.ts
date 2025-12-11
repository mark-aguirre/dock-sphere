/**
 * Property-based tests for setup configuration data models
 * **Feature: environment-setup-page, Property 1: Configuration save preserves valid data**
 * **Validates: Requirements 1.2**
 */

import * as fc from 'fast-check';
import { 
  SetupConfiguration,
  DockerConfiguration,
  AuthConfiguration,
  OAuthConfiguration,
  DatabaseConfiguration,
  ApplicationConfiguration,
  LoggingConfiguration,
} from '@/types/setup-config';
import { 
  setupConfigSchema,
  dockerConfigSchema,
  authConfigSchema,
  oauthConfigSchema,
  databaseConfigSchema,
  applicationConfigSchema,
  loggingConfigSchema,
} from '@/lib/validation/setup-schemas';
import { mergeWithDefaults, isConfigurationComplete } from '@/lib/utils/setup-utils';

// Generators for configuration data
const dockerConfigArbitrary = fc.record({
  socket: fc.oneof(
    fc.constant('//./pipe/docker_engine'), // Windows
    fc.constant('/var/run/docker.sock'),   // Unix
    fc.string({ minLength: 1, maxLength: 100 })
  ),
});

const authConfigArbitrary = fc.record({
  nextAuthUrl: fc.webUrl(),
  nextAuthSecret: fc.string({ minLength: 32, maxLength: 64 }),
});

const oauthProviderArbitrary = fc.record({
  clientId: fc.string({ minLength: 10, maxLength: 50 }),
  clientSecret: fc.string({ minLength: 20, maxLength: 100 }),
  callbackUrl: fc.option(fc.webUrl()),
});

const oauthConfigArbitrary = fc.record({
  google: fc.option(oauthProviderArbitrary),
  github: fc.option(oauthProviderArbitrary),
  gitlab: fc.option(oauthProviderArbitrary),
}).filter(oauth => oauth.google || oauth.github || oauth.gitlab); // At least one provider

const databaseConfigArbitrary = fc.record({
  url: fc.string().map(s => `postgresql://user:pass@localhost:5432/${s}`),
  supabaseUrl: fc.webUrl().filter(url => url.includes('supabase')),
  supabaseAnonKey: fc.string({ minLength: 50, maxLength: 200 }),
  supabaseServiceKey: fc.string({ minLength: 50, maxLength: 200 }),
});

const applicationConfigArbitrary = fc.record({
  appUrl: fc.webUrl(),
  adminEmails: fc.array(fc.emailAddress(), { minLength: 1, maxLength: 5 }),
});

const loggingConfigArbitrary = fc.record({
  level: fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
  enableRequestLogging: fc.boolean(),
  enablePerformanceLogging: fc.boolean(),
  enableDockerLogging: fc.boolean(),
  format: fc.constantFrom('json', 'pretty'),
  maxLogSize: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }), // 1KB to 100MB
  retentionDays: fc.integer({ min: 1, max: 365 }),
});

const setupConfigArbitrary = fc.record({
  docker: dockerConfigArbitrary,
  auth: authConfigArbitrary,
  oauth: oauthConfigArbitrary,
  database: databaseConfigArbitrary,
  application: applicationConfigArbitrary,
  logging: loggingConfigArbitrary,
});

describe('Setup Configuration Property Tests', () => {
  describe('Property 1: Configuration save preserves valid data', () => {
    test('Docker configuration round-trip preservation', () => {
      fc.assert(
        fc.property(dockerConfigArbitrary, (dockerConfig) => {
          // Validate the generated config
          const validationResult = dockerConfigSchema.safeParse(dockerConfig);
          
          if (validationResult.success) {
            // If valid, the parsed data should equal the original
            expect(validationResult.data).toEqual(dockerConfig);
            
            // Serialization round-trip should preserve data
            const serialized = JSON.stringify(dockerConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(dockerConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('Auth configuration round-trip preservation', () => {
      fc.assert(
        fc.property(authConfigArbitrary, (authConfig) => {
          const validationResult = authConfigSchema.safeParse(authConfig);
          
          if (validationResult.success) {
            expect(validationResult.data).toEqual(authConfig);
            
            const serialized = JSON.stringify(authConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(authConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('OAuth configuration round-trip preservation', () => {
      fc.assert(
        fc.property(oauthConfigArbitrary, (oauthConfig) => {
          const validationResult = oauthConfigSchema.safeParse(oauthConfig);
          
          if (validationResult.success) {
            expect(validationResult.data).toEqual(oauthConfig);
            
            const serialized = JSON.stringify(oauthConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(oauthConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('Database configuration round-trip preservation', () => {
      fc.assert(
        fc.property(databaseConfigArbitrary, (databaseConfig) => {
          const validationResult = databaseConfigSchema.safeParse(databaseConfig);
          
          if (validationResult.success) {
            expect(validationResult.data).toEqual(databaseConfig);
            
            const serialized = JSON.stringify(databaseConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(databaseConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('Application configuration round-trip preservation', () => {
      fc.assert(
        fc.property(applicationConfigArbitrary, (applicationConfig) => {
          const validationResult = applicationConfigSchema.safeParse(applicationConfig);
          
          if (validationResult.success) {
            expect(validationResult.data).toEqual(applicationConfig);
            
            const serialized = JSON.stringify(applicationConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(applicationConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('Logging configuration round-trip preservation', () => {
      fc.assert(
        fc.property(loggingConfigArbitrary, (loggingConfig) => {
          const validationResult = loggingConfigSchema.safeParse(loggingConfig);
          
          if (validationResult.success) {
            expect(validationResult.data).toEqual(loggingConfig);
            
            const serialized = JSON.stringify(loggingConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(loggingConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('Complete setup configuration round-trip preservation', () => {
      fc.assert(
        fc.property(setupConfigArbitrary, (setupConfig) => {
          const validationResult = setupConfigSchema.safeParse(setupConfig);
          
          if (validationResult.success) {
            // Validated data should equal original
            expect(validationResult.data).toEqual(setupConfig);
            
            // Serialization round-trip should preserve data
            const serialized = JSON.stringify(setupConfig);
            const deserialized = JSON.parse(serialized);
            expect(deserialized).toEqual(setupConfig);
            
            // Configuration should be marked as complete
            expect(isConfigurationComplete(setupConfig)).toBe(true);
            
            // Merging with defaults should preserve all provided values
            const merged = mergeWithDefaults(setupConfig);
            expect(merged.docker).toEqual(setupConfig.docker);
            expect(merged.auth).toEqual(setupConfig.auth);
            expect(merged.oauth).toEqual(setupConfig.oauth);
            expect(merged.database).toEqual(setupConfig.database);
            expect(merged.application).toEqual(setupConfig.application);
            expect(merged.logging).toEqual(setupConfig.logging);
          }
        }),
        { numRuns: 100 }
      );
    });

    test('Partial configuration merging preserves provided values', () => {
      fc.assert(
        fc.property(
          fc.record({
            docker: fc.option(dockerConfigArbitrary),
            auth: fc.option(authConfigArbitrary),
            oauth: fc.option(oauthConfigArbitrary),
            database: fc.option(databaseConfigArbitrary),
            application: fc.option(applicationConfigArbitrary),
            logging: fc.option(loggingConfigArbitrary),
          }),
          (partialConfig) => {
            const merged = mergeWithDefaults(partialConfig);
            
            // All provided sections should be preserved exactly
            if (partialConfig.docker) {
              expect(merged.docker).toEqual(partialConfig.docker);
            }
            if (partialConfig.auth) {
              expect(merged.auth).toEqual(partialConfig.auth);
            }
            if (partialConfig.oauth) {
              expect(merged.oauth).toEqual(partialConfig.oauth);
            }
            if (partialConfig.database) {
              expect(merged.database).toEqual(partialConfig.database);
            }
            if (partialConfig.application) {
              expect(merged.application).toEqual(partialConfig.application);
            }
            if (partialConfig.logging) {
              expect(merged.logging).toEqual(partialConfig.logging);
            }
            
            // Merged result should always be a complete configuration
            expect(merged.docker).toBeDefined();
            expect(merged.auth).toBeDefined();
            expect(merged.oauth).toBeDefined();
            expect(merged.database).toBeDefined();
            expect(merged.application).toBeDefined();
            expect(merged.logging).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration validation properties', () => {
    test('Valid configurations always pass validation', () => {
      fc.assert(
        fc.property(setupConfigArbitrary, (config) => {
          const result = setupConfigSchema.safeParse(config);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('Configuration completeness is consistent', () => {
      fc.assert(
        fc.property(setupConfigArbitrary, (config) => {
          const isComplete = isConfigurationComplete(config);
          const validationResult = setupConfigSchema.safeParse(config);
          
          // If validation passes, configuration should be complete
          if (validationResult.success) {
            expect(isComplete).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});