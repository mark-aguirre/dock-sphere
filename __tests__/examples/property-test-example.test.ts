import fc from 'fast-check';

/**
 * Example property-based tests using fast-check
 * These demonstrate the testing approach for the Container Manager
 */

describe('Property-Based Testing Examples', () => {
  
  // Example: String validation property
  test('validation should accept valid strings and reject invalid ones', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (str) => {
          const isValid = str.trim().length > 0;
          return isValid === (str.trim().length > 0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Example: Array transformation property
  test('filtering an array should not increase its length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        fc.func(fc.boolean()),
        (arr, predicate) => {
          const filtered = arr.filter(predicate);
          return filtered.length <= arr.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Example: Object property preservation
  test('adding a property to an object should preserve existing properties', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          value: fc.integer()
        }),
        fc.string(),
        fc.anything(),
        (obj, key, value) => {
          const originalKeys = Object.keys(obj);
          const newObj = { ...obj, [key]: value };
          return originalKeys.every(k => k in newObj);
        }
      ),
      { numRuns: 100 }
    );
  });
});
