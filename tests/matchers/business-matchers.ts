/**
 * Custom Jest/Vitest Matchers for Business Logic Testing
 * 
 * Provides English-language-like assertions that make tests more readable
 * and express business intent rather than technical implementation details.
 */

import { expect } from 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidationError(errorCode: string, messagePart: string): T;
    toBeWithinPerformanceTarget(maxMs: number): T;
    toHaveMinecraftItemStructure(): T;
    toBeAvailableItem(): T;
    toBeValidUser(): T;
    toBeValidPrice(): T;
    toHaveSearchResults(expectedCount?: number): T;
    toContainMinecraftItem(itemName: string): T;
  }
}

expect.extend({
  /**
   * Validates that an error is a proper validation error with expected code and message
   * 
   * @example
   * await expect(itemRepository.create(invalidData))
   *   .rejects
   *   .toBeValidationError('INVALID_OWNER_ID', 'Owner ID is required');
   */
  toBeValidationError(received: any, errorCode: string, messagePart: string) {
    const isValidationError = 
      received.name?.includes('ValidationError') &&
      received.code === errorCode &&
      received.message?.includes(messagePart);
    
    return {
      pass: isValidationError,
      message: () => isValidationError
        ? `Expected not to be validation error with code ${errorCode}`
        : `Expected validation error with code ${errorCode} and message containing "${messagePart}", got ${received.name}:${received.code} - "${received.message}"`
    };
  },

  /**
   * Validates that a numeric value (typically time in ms) is within performance targets
   * 
   * @example
   * expect(responseTime).toBeWithinPerformanceTarget(2000);
   */
  toBeWithinPerformanceTarget(received: number, maxMs: number) {
    const pass = received < maxMs;
    return {
      pass,
      message: () => pass
        ? `Expected ${received}ms to exceed ${maxMs}ms performance target`
        : `Expected ${received}ms to be under ${maxMs}ms performance target (Epic 1 requirement)`
    };
  },

  /**
   * Validates that an object has the expected structure of a Minecraft marketplace item
   * 
   * @example
   * expect(item).toHaveMinecraftItemStructure();
   */
  toHaveMinecraftItemStructure(received: any) {
    const requiredFields = ['id', 'name', 'category', 'minecraftId', 'isAvailable', 'stockQuantity'];
    const missingFields = requiredFields.filter(field => !(field in received));
    const hasAllFields = missingFields.length === 0;
    
    return {
      pass: hasAllFields,
      message: () => hasAllFields
        ? 'Expected not to have complete Minecraft item structure'
        : `Expected to have all required Minecraft item fields. Missing: ${missingFields.join(', ')}`
    };
  },

  /**
   * Validates that an item is properly available for marketplace display
   * 
   * @example
   * expect(item).toBeAvailableItem();
   */
  toBeAvailableItem(received: any) {
    const isAvailable = 
      received.isAvailable === true &&
      received.stockQuantity > 0 &&
      received.name?.trim().length > 0;
    
    return {
      pass: isAvailable,
      message: () => isAvailable
        ? 'Expected item not to be available'
        : `Expected available item (isAvailable: true, stockQuantity > 0, name not empty). Got: isAvailable=${received.isAvailable}, stockQuantity=${received.stockQuantity}, name="${received.name}"`
    };
  },

  /**
   * Validates that a user object has proper structure and required fields
   * 
   * @example
   * expect(user).toBeValidUser();
   */
  toBeValidUser(received: any) {
    const requiredFields = ['id', 'discordId', 'username'];
    const hasRequiredFields = requiredFields.every(field => received[field]);
    const hasValidDiscordId = typeof received.discordId === 'string' && received.discordId.length > 0;
    const hasValidUsername = typeof received.username === 'string' && received.username.trim().length > 0;
    
    const isValid = hasRequiredFields && hasValidDiscordId && hasValidUsername;
    
    return {
      pass: isValid,
      message: () => isValid
        ? 'Expected not to be valid user'
        : `Expected valid user with id, discordId, and username. Got: ${JSON.stringify(received, null, 2)}`
    };
  },

  /**
   * Validates that a price object has proper structure and valid values
   * 
   * @example
   * expect(price).toBeValidPrice();
   */
  toBeValidPrice(received: any) {
    const hasRequiredFields = 
      received.priceDiamonds !== undefined &&
      received.tradingUnit !== undefined;
    
    const hasValidPrice = 
      typeof received.priceDiamonds === 'number' &&
      received.priceDiamonds >= 0;
    
    const hasValidTradingUnit = 
      ['per_item', 'per_stack', 'per_shulker', 'per_dozen'].includes(received.tradingUnit);
    
    const isValid = hasRequiredFields && hasValidPrice && hasValidTradingUnit;
    
    return {
      pass: isValid,
      message: () => isValid
        ? 'Expected not to be valid price'
        : `Expected valid price with non-negative priceDiamonds and valid tradingUnit. Got: ${JSON.stringify(received, null, 2)}`
    };
  },

  /**
   * Validates that search results are properly formatted and contain expected count
   * 
   * @example
   * expect(results).toHaveSearchResults(5);
   * expect(results).toHaveSearchResults(); // Any count > 0
   */
  toHaveSearchResults(received: any, expectedCount?: number) {
    const isArray = Array.isArray(received);
    const hasItems = isArray && received.length > 0;
    const hasExpectedCount = expectedCount === undefined || received.length === expectedCount;
    const allItemsValid = isArray && received.every((item: any) => 
      item.id && item.name && typeof item.name === 'string'
    );
    
    const isValid = isArray && hasExpectedCount && (expectedCount === 0 || (hasItems && allItemsValid));
    
    return {
      pass: isValid,
      message: () => {
        if (!isArray) return `Expected array of search results, got ${typeof received}`;
        if (expectedCount !== undefined && received.length !== expectedCount) {
          return `Expected ${expectedCount} search results, got ${received.length}`;
        }
        if (expectedCount !== 0 && !hasItems) return 'Expected search results to contain items';
        if (!allItemsValid) return 'Expected all search results to have valid item structure (id, name)';
        return 'Expected not to have valid search results';
      }
    };
  },

  /**
   * Validates that search results contain a specific Minecraft item by name
   * 
   * @example
   * expect(searchResults).toContainMinecraftItem('Diamond Sword');
   */
  toContainMinecraftItem(received: any, itemName: string) {
    const isArray = Array.isArray(received);
    const containsItem = isArray && received.some((item: any) => 
      item.name?.toLowerCase().includes(itemName.toLowerCase())
    );
    
    return {
      pass: containsItem,
      message: () => containsItem
        ? `Expected search results not to contain "${itemName}"`
        : `Expected search results to contain item with name "${itemName}". Found items: ${isArray ? received.map((i: any) => i.name).join(', ') : 'not an array'}`
    };
  }
});

/**
 * Helper function to create readable test descriptions for validation scenarios
 */
export function describeValidation(entityType: string, scenario: string): string {
  return `should reject ${entityType} with ${scenario}`;
}

/**
 * Helper function to create readable test descriptions for business scenarios
 */
export function describeBusiness(action: string, context: string): string {
  return `should ${action} when ${context}`;
}

/**
 * Helper function to create readable test descriptions for performance scenarios
 */
export function describePerformance(operation: string, target: string): string {
  return `should complete ${operation} within ${target}`;
}