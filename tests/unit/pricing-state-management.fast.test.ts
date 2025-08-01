/**
 * Pricing State Management Tests
 * Tests the comprehensive pricing state management implementation
 * Verifies all pricing actions and derived stores work correctly
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { setupFastTests, expectFastExecution } from '../utils/fast-test-setup.js';
import { 
  pricingState, 
  pricingActions, 
  priceDisplay, 
  priceValidation, 
  tradingUnitHelpers 
} from '../../workspaces/frontend/src/lib/pricing-display-state.js';

// Setup fast tests with MSW mocking
setupFastTests();

describe('Pricing State Management - Comprehensive Testing', () => {
  
  beforeEach(() => {
    // Reset pricing state before each test
    pricingState.set({
      rawPrice: 0, tradingUnit: 'per_item', displayPrice: '', hasDiamondSymbol: false, isMinecraftThemed: false,
      showAsBlocks: false, blockDisplay: '', isEasyToRead: false, blocks: 0, remainingDiamonds: 0,
      displayText: '', isPlayerFriendly: false, displayUnit: '', clarityIcon: '', isObvious: false,
      individualPrice: 0, showBothPrices: false, comparisonText: '', helpsComparison: false,
      unitIcons: {}, hasMinecraftTheme: false, isRecognizable: false, averagePrice: 0,
      showComparison: false, dealIndicator: '', isHelpful: false, previousPrice: 0,
      trendDirection: '', trendIndicator: '', showsTrend: false, showWarning: false,
      warningType: '', protectsUsers: false, formattedPrice: '', showsDecimals: false,
      isReadable: false, avoidConfusion: false, zeroDisplay: '', lowPriceDisplay: '',
      handlesEdgeCases: false, isHighlighted: false, hasConsistentFormatting: false,
      easyToScan: false, visuallyDistinct: false, showsPreview: false, hasValidation: false,
      guidesUser: false, previewText: '', suggestedRange: null, showsSuggestions: false,
      helpsNewSellers: false, suggestion: ''
    });
  });
  
  describe('🔧 Basic Price Setting', () => {
    test('should set basic price with diamond symbol', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(25.5);
      const state = get(pricingState);
      
      expect(state.rawPrice).toBe(25.5);
      expect(state.displayPrice).toBe('💎 25.5');
      expect(state.hasDiamondSymbol).toBe(true);
      expect(state.isMinecraftThemed).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should handle zero price with free display', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(0);
      const state = get(pricingState);
      
      expect(state.rawPrice).toBe(0);
      expect(state.displayPrice).toBe('🆓 Free');
      expect(state.hasDiamondSymbol).toBe(false);
      expect(state.zeroDisplay).toBe('🆓 Free');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should handle different trading units', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(64, 'per_stack');
      const state = get(pricingState);
      
      expect(state.tradingUnit).toBe('per_stack');
      expect(state.displayUnit).toBe('per stack (64 items)');
      expect(state.clarityIcon).toBe('📦');
      expect(state.individualPrice).toBe(1); // 64/64 = 1
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });
  
  describe('💠 Diamond Block Conversion', () => {
    test('should show blocks for large amounts', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(128); // 2 blocks
      const state = get(pricingState);
      
      expect(state.showAsBlocks).toBe(true);
      expect(state.blockDisplay).toBe('💠 2 blocks');
      expect(state.blocks).toBe(2);
      expect(state.remainingDiamonds).toBe(0);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should handle mixed block and diamond display', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(100); // 1 block + 36 diamonds
      const state = get(pricingState);
      
      expect(state.blocks).toBe(1);
      expect(state.remainingDiamonds).toBe(36);
      expect(state.displayText).toBe('💠 1 block + 💎 36 diamonds');
      expect(state.isPlayerFriendly).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should not show blocks for small amounts', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(32); // Less than 64
      const state = get(pricingState);
      
      expect(state.showAsBlocks).toBe(false);
      expect(state.blockDisplay).toBe('');
      expect(state.displayText).toBe('💎 32');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });
  
  describe('📦 Trading Unit Management', () => {
    test('should calculate individual prices correctly', async () => {
      const start = performance.now();
      
      // Test different trading units
      pricingActions.setPrice(64, 'per_stack');
      expect(get(pricingState).individualPrice).toBe(1); // 64/64
      
      pricingActions.setPrice(1728, 'per_shulker');
      expect(get(pricingState).individualPrice).toBe(1); // 1728/1728
      
      pricingActions.setPrice(12, 'per_dozen');
      expect(get(pricingState).individualPrice).toBe(1); // 12/12
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
    
    test('should provide correct trading unit icons', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(10);
      const state = get(pricingState);
      
      expect(state.unitIcons['per_item']).toBe('🔹');
      expect(state.unitIcons['per_stack']).toBe('📦');
      expect(state.unitIcons['per_shulker']).toBe('🟪');
      expect(state.unitIcons['per_dozen']).toBe('📦');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should show comparison text for non-item units', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(128, 'per_stack');
      const state = get(pricingState);
      
      expect(state.showBothPrices).toBe(true);
      expect(state.comparisonText).toBe('💎 2 each'); // 128/64 = 2
      expect(state.helpsComparison).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });
  
  describe('📊 Price Context and Comparison', () => {
    test('should identify good deals', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(20);
      pricingActions.setPriceContext(20, 30); // 20 vs 30 average
      const state = get(pricingState);
      
      expect(state.showComparison).toBe(true);
      expect(state.dealIndicator).toBe('🟢 Good Deal');
      expect(state.isHelpful).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should identify above average prices', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(40);
      pricingActions.setPriceContext(40, 30); // 40 vs 30 average
      const state = get(pricingState);
      
      expect(state.dealIndicator).toBe('🔴 Above Average');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should show price trends', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(25);
      pricingActions.setPriceContext(25, 30, 35); // Down from 35 to 25
      const state = get(pricingState);
      
      expect(state.trendDirection).toBe('down');
      expect(state.trendIndicator).toBe('📉');
      expect(state.showsTrend).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should warn about extreme prices', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(1000);
      pricingActions.setPriceContext(1000, 25); // 40x average
      const state = get(pricingState);
      
      expect(state.showWarning).toBe(true);
      expect(state.warningType).toBe('unusually_high');
      expect(state.protectsUsers).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });
  
  describe('💡 Price Suggestions', () => {
    test('should provide category-based suggestions', async () => {
      const start = performance.now();
      
      pricingActions.setPriceSuggestions('weapons');
      const state = get(pricingState);
      
      expect(state.suggestedRange).toEqual({ min: 20, max: 30 });
      expect(state.showsSuggestions).toBe(true);
      expect(state.suggestion).toBe('Similar weapons sell for 💎 20-30');
      expect(state.helpsNewSellers).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should handle different item categories', async () => {
      const start = performance.now();
      
      pricingActions.setPriceSuggestions('blocks');
      const state = get(pricingState);
      
      expect(state.suggestedRange).toEqual({ min: 1, max: 5 });
      expect(state.suggestion).toBe('Similar blocks sell for 💎 1-5');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });
  
  describe('🧮 Derived Stores', () => {
    test('should provide correct price display information', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(25, 'per_stack');
      pricingActions.setPriceContext(25, 30);
      
      const display = get(priceDisplay);
      
      expect(display.formatted).toBe('💎 25');
      expect(display.withUnit).toBe('💎 25 per stack (64 items)');
      expect(display.dealIndicator).toBe('🟢 Good Deal');
      expect(display.trendIndicator).toBe('➡️'); // No previous price set
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
    
    test('should provide validation information', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(1000);
      pricingActions.setPriceContext(1000, 25);
      pricingActions.setPriceSuggestions('weapons');
      
      const validation = get(priceValidation);
      
      expect(validation.isValid).toBe(true);
      expect(validation.showWarning).toBe(true);
      expect(validation.warningMessage).toBe('This price seems very high');
      expect(validation.suggestions).toBe('Similar weapons sell for 💎 20-30');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
    
    test('should provide trading unit helpers', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(64, 'per_stack');
      const helpers = get(tradingUnitHelpers);
      
      expect(helpers.icon).toBe('📦');
      expect(helpers.display).toBe('per stack (64 items)');
      expect(helpers.individualPrice).toBe(1);
      expect(helpers.comparison).toBe('💎 1 each');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });
  
  describe('⚡ Performance and Edge Cases', () => {
    test('should handle rapid price updates efficiently', async () => {
      const start = performance.now();
      
      // Test rapid updates
      for (let i = 0; i < 10; i++) {
        pricingActions.setPrice(i * 5, 'per_item');
        pricingActions.setPriceContext(i * 5, 25);
      }
      
      const state = get(pricingState);
      expect(state.rawPrice).toBe(45); // Last price
      expect(state.displayPrice).toBe('💎 45');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });
    
    test('should handle decimal rounding correctly', async () => {
      const start = performance.now();
      
      pricingActions.setPrice(99.99, 'per_stack'); // Should round individual price nicely
      const state = get(pricingState);
      
      expect(state.individualPrice).toBe(1.56); // 99.99/64 rounded to 2 decimals
      expect(state.showsDecimals).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
    
    test('should maintain state consistency across updates', async () => {
      const start = performance.now();
      
      // Set initial state
      pricingActions.setPrice(25, 'per_stack');
      pricingActions.setPriceContext(25, 30, 28);
      pricingActions.setPriceSuggestions('weapons');
      
      const initialState = get(pricingState);
      
      // Update price only
      pricingActions.setPrice(30, 'per_stack');
      const updatedState = get(pricingState);
      
      // Previous context should still be there
      expect(updatedState.averagePrice).toBe(30);
      expect(updatedState.previousPrice).toBe(28);
      expect(updatedState.suggestedRange).toEqual({ min: 20, max: 30 });
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
  });
});