/**
 * Validation Test Mixins
 * 
 * Provides reusable validation test patterns that eliminate duplication
 * and create more English-language-like test descriptions.
 */

import { it, expect } from 'vitest';
import '../matchers/business-matchers.js';

export interface ValidationTestCase<T> {
  name: string;
  invalidData: Partial<T>;
  expectedErrorType: string;
  expectedErrorCode: string;
  expectedMessagePart: string;
}

/**
 * Creates a series of validation error tests for a repository method
 * This eliminates the repetitive try-catch boilerplate in validation testing
 * 
 * @example
 * const validationTests = createValidationErrorTests(
 *   () => new ItemRepository(),
 *   'create',
 *   createItemValidationCases()
 * );
 * 
 * validationTests.forEach(test => it(test.name, test.test));
 */
export function createValidationErrorTests<TRepository, TEntity>(
  repositoryFactory: () => TRepository,
  methodName: keyof TRepository,
  testCases: ValidationTestCase<TEntity>[]
) {
  return testCases.map(testCase => ({
    name: `should reject ${testCase.name} with ${testCase.expectedErrorCode}`,
    test: async () => {
      const repository = repositoryFactory();
      
      await expect((repository[methodName] as any)(testCase.invalidData))
        .rejects
        .toBeValidationError(testCase.expectedErrorCode, testCase.expectedMessagePart);
    }
  }));
}

/**
 * Creates validation tests with more English-language-like descriptions
 * 
 * @example
 * const readableTests = createReadableValidationTests(
 *   'ItemRepository',
 *   'item creation',
 *   () => new ItemRepository(),
 *   'create',
 *   createItemValidationCases()
 * );
 */
export function createReadableValidationTests<TRepository, TEntity>(
  entityName: string,
  operationName: string,
  repositoryFactory: () => TRepository,
  methodName: keyof TRepository,
  testCases: ValidationTestCase<TEntity>[]
) {
  return testCases.map(testCase => ({
    name: `should prevent ${operationName} when ${testCase.name}`,
    test: async () => {
      const repository = repositoryFactory();
      
      await expect((repository[methodName] as any)(testCase.invalidData))
        .rejects
        .toBeValidationError(testCase.expectedErrorCode, testCase.expectedMessagePart);
      
      console.log(`✅ ${entityName} properly rejected ${testCase.name}`);
    }
  }));
}

/**
 * Creates business rule validation tests with context
 * 
 * @example
 * const businessTests = createBusinessRuleTests(
 *   'ItemRepository',
 *   () => new ItemRepository(),
 *   [
 *     {
 *       rule: 'stock quantity must be non-negative',
 *       scenario: 'merchant tries to list item with negative stock',
 *       operation: (repo) => repo.create({ ...validData, stockQuantity: -1 }),
 *       expectedError: { code: 'INVALID_STOCK_QUANTITY', message: 'cannot be negative' }
 *     }
 *   ]
 * );
 */
export function createBusinessRuleTests<TRepository>(
  entityName: string,
  repositoryFactory: () => TRepository,
  businessRules: Array<{
    rule: string;
    scenario: string;
    operation: (repository: TRepository) => Promise<any>;
    expectedError: { code: string; message: string };
  }>
) {
  return businessRules.map(rule => ({
    name: `should enforce rule: ${rule.rule} (scenario: ${rule.scenario})`,
    test: async () => {
      const repository = repositoryFactory();
      
      await expect(rule.operation(repository))
        .rejects
        .toBeValidationError(rule.expectedError.code, rule.expectedError.message);
      
      console.log(`✅ ${entityName} enforced business rule: ${rule.rule}`);
    }
  }));
}

/**
 * Creates field validation test mixin for common validation patterns
 */
export const fieldValidationMixin = {
  /**
   * Tests required field validation
   */
  requiredField<TRepository>(
    fieldName: string,
    repositoryFactory: () => TRepository,
    methodName: keyof TRepository,
    validData: any,
    expectedErrorCode: string
  ) {
    return [
      {
        name: `should require ${fieldName}`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: undefined };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(expectedErrorCode, `${fieldName} is required`);
        }
      },
      {
        name: `should reject empty ${fieldName}`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: '' };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(expectedErrorCode, `${fieldName} is required`);
        }
      },
      {
        name: `should reject whitespace-only ${fieldName}`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: '   ' };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(expectedErrorCode, `${fieldName} is required`);
        }
      }
    ];
  },

  /**
   * Tests numeric field validation
   */
  numericField<TRepository>(
    fieldName: string,
    repositoryFactory: () => TRepository,
    methodName: keyof TRepository,
    validData: any,
    constraints: {
      min?: number;
      max?: number;
      positiveOnly?: boolean;
      integerOnly?: boolean;
    }
  ) {
    const tests = [];

    if (constraints.min !== undefined) {
      tests.push({
        name: `should reject ${fieldName} below minimum (${constraints.min})`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: constraints.min! - 1 };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(`INVALID_${fieldName.toUpperCase()}`, 'minimum');
        }
      });
    }

    if (constraints.max !== undefined) {
      tests.push({
        name: `should reject ${fieldName} above maximum (${constraints.max})`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: constraints.max! + 1 };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(`INVALID_${fieldName.toUpperCase()}`, 'maximum');
        }
      });
    }

    if (constraints.positiveOnly) {
      tests.push({
        name: `should reject negative ${fieldName}`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: -1 };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(`INVALID_${fieldName.toUpperCase()}`, 'negative');
        }
      });
    }

    if (constraints.integerOnly) {
      tests.push({
        name: `should reject non-integer ${fieldName}`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: 1.5 };
          
          await expect((repository[methodName] as any)(invalidData))
            .rejects
            .toBeValidationError(`INVALID_${fieldName.toUpperCase()}`, 'integer');
        }
      });
    }

    return tests;
  },

  /**
   * Tests enum field validation
   */
  enumField<TRepository>(
    fieldName: string,
    repositoryFactory: () => TRepository,
    methodName: keyof TRepository,
    validData: any,
    validValues: string[],
    expectedErrorCode: string
  ) {
    return [
      {
        name: `should reject invalid ${fieldName} value`,
        test: async () => {
          const repository = repositoryFactory();
          const invalidData = { ...validData, [fieldName]: 'invalid_value' };
          
          try {
            await (repository[methodName] as any)(invalidData);
            expect.fail('Should have thrown validation error');
          } catch (error: any) {
            expect(error.name).toContain('ValidationError');
            expect(error.code).toBe(expectedErrorCode);
          }
        }
      },
      {
        name: `should accept all valid ${fieldName} values`,
        test: async () => {
          const repository = repositoryFactory();
          
          for (const validValue of validValues) {
            const validDataWithValue = { ...validData, [fieldName]: validValue };
            
            // Should not throw
            const result = await (repository[methodName] as any)(validDataWithValue);
            expect(result[fieldName]).toBe(validValue);
          }
        }
      }
    ];
  }
};

/**
 * Higher-order function to create a complete validation test suite
 */
export function createValidationTestSuite<TRepository, TEntity>(
  entityName: string,
  repositoryFactory: () => TRepository,
  validationConfig: {
    createMethod: keyof TRepository;
    updateMethod: keyof TRepository;
    validData: Partial<TEntity>;
    requiredFields: Array<{
      name: string;
      errorCode: string;
    }>;
    numericFields: Array<{
      name: string;
      constraints: {
        min?: number;
        max?: number;  
        positiveOnly?: boolean;
        integerOnly?: boolean;
      };
    }>;
    enumFields: Array<{
      name: string;
      validValues: string[];
      errorCode: string;
    }>;
    customValidationCases: ValidationTestCase<TEntity>[];
  }
) {
  const allTests = [];

  // Required field tests
  validationConfig.requiredFields.forEach(field => {
    const fieldTests = fieldValidationMixin.requiredField(
      field.name,
      repositoryFactory,
      validationConfig.createMethod,
      validationConfig.validData,
      field.errorCode
    );
    allTests.push(...fieldTests);
  });

  // Numeric field tests
  validationConfig.numericFields.forEach(field => {
    const fieldTests = fieldValidationMixin.numericField(
      field.name,
      repositoryFactory,
      validationConfig.createMethod,
      validationConfig.validData,
      field.constraints
    );
    allTests.push(...fieldTests);
  });

  // Enum field tests
  validationConfig.enumFields.forEach(field => {
    const fieldTests = fieldValidationMixin.enumField(
      field.name,
      repositoryFactory,
      validationConfig.createMethod,
      validationConfig.validData,
      field.validValues,
      field.errorCode
    );
    allTests.push(...fieldTests);
  });

  // Custom validation tests
  const customTests = createReadableValidationTests(
    entityName,
    'creation',
    repositoryFactory,
    validationConfig.createMethod,
    validationConfig.customValidationCases
  );
  allTests.push(...customTests);

  return allTests;
}