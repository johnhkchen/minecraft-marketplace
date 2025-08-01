/**
 * Fast PriceRepository Tests - DI Pattern
 * 
 * Testing price management functionality with dependency injection:
 * - Diamond-based currency system with steve/alex usernames
 * - Trading unit support (per_item, per_stack, per_shulker, per_dozen)  
 * - Performance validation (<10ms per test)
 * - Zero external dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PriceRepository, PriceValidationError } from '../../../workspaces/shared/repositories/price-repository.js';
import type { Price, TradingUnitType } from '../../../workspaces/shared/types/service-interfaces.js';
import { ServiceContainer } from '../../../workspaces/shared/di/container.js';
import { measure, expectFastExecution } from '../../utils/fast-test-setup.js';

// Minecraft domain test data
const TEST_DATA = {
  mainTrader: 'steve',
  altTrader: 'alex',
  adminUser: 'notch',
  primaryItem: 'minecraft:diamond_sword',
  secondaryItem: 'minecraft:iron_pickaxe',
  enchantedItem: 'minecraft:enchanted_book'
};

describe('PriceRepository - DI Fast', () => {
  let container: ServiceContainer;
  let priceRepository: PriceRepository;

  beforeEach(async () => {
    container = new ServiceContainer();
    container.register('priceRepository', () => new PriceRepository());
    priceRepository = container.get<PriceRepository>('priceRepository');
    await priceRepository.clear(); // Start with clean state
  });

  describe('create', () => {
    it('should create diamond sword price with steve username', async () => {
      const { result: price, timeMs } = await measure(async () => {
        return priceRepository.create({
          itemId: TEST_DATA.primaryItem,
          priceDiamonds: 5.50,
          tradingUnit: 'per_item' as TradingUnitType,
          isCurrent: true,
          source: 'owner',
          createdBy: TEST_DATA.mainTrader
        });
      });

      expectFastExecution(timeMs, 10);
      expect(price.id).toBeDefined();
      expect(price.itemId).toBe(TEST_DATA.primaryItem);
      expect(price.priceDiamonds).toBe(5.50);
      expect(price.tradingUnit).toBe('per_item');
      expect(price.isCurrent).toBe(true);
      expect(price.source).toBe('owner');
      expect(price.createdBy).toBe(TEST_DATA.mainTrader);
      expect(price.createdAt).toBeInstanceOf(Date);
    });

    it('should validate missing item ID with fast execution', async () => {
      const { timeMs } = await measure(async () => {
        try {
          await priceRepository.create({
            itemId: '',
            priceDiamonds: 5.00,
            tradingUnit: 'per_item' as TradingUnitType,
            isCurrent: true,
            source: 'owner',
            createdBy: TEST_DATA.mainTrader
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.name).toBe('PriceValidationError');
          expect(error.code).toBe('INVALID_ITEM_ID');
        }
      });

      expectFastExecution(timeMs, 5);
    });

    it('should validate negative price with performance tracking', async () => {
      const { timeMs } = await measure(async () => {
        try {
          await priceRepository.create({
            itemId: TEST_DATA.primaryItem,
            priceDiamonds: -1.50,
            tradingUnit: 'per_item' as TradingUnitType,
            isCurrent: true,
            source: 'owner',
            createdBy: TEST_DATA.mainTrader
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.name).toBe('PriceValidationError');
          expect(error.code).toBe('INVALID_PRICE');
        }
      });

      expectFastExecution(timeMs, 5);
    });

    it('should validate missing created by user with alex username', async () => {
      const { timeMs } = await measure(async () => {
        try {
          await priceRepository.create({
            itemId: TEST_DATA.secondaryItem,
            priceDiamonds: 5.00,
            tradingUnit: 'per_item' as TradingUnitType,
            isCurrent: true,
            source: 'owner',
            createdBy: ''
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.name).toBe('PriceValidationError');
          expect(error.code).toBe('INVALID_CREATED_BY');
        }
      });

      expectFastExecution(timeMs, 5);
    });
  });

  describe('findCurrentByItemId', () => {
    it('should return current diamond sword price for steve', async () => {
      await priceRepository.create({
        itemId: TEST_DATA.primaryItem,
        priceDiamonds: 5.50,
        tradingUnit: 'per_item' as TradingUnitType,
        isCurrent: true,
        source: 'owner',
        createdBy: TEST_DATA.mainTrader
      });

      const { result: currentPrice, timeMs } = await measure(async () => {
        return priceRepository.findCurrentByItemId(TEST_DATA.primaryItem);
      });

      expectFastExecution(timeMs, 5);
      expect(currentPrice).toBeDefined();
      expect(currentPrice?.itemId).toBe(TEST_DATA.primaryItem);
      expect(currentPrice?.isCurrent).toBe(true);
      expect(currentPrice?.createdBy).toBe(TEST_DATA.mainTrader);
    });

    it('should return null for nonexistent item with fast execution', async () => {
      const { result: currentPrice, timeMs } = await measure(async () => {
        return priceRepository.findCurrentByItemId('minecraft:nonexistent_item');
      });

      expectFastExecution(timeMs, 5);
      expect(currentPrice).toBeNull();
    });
  });

  describe('findHistoryByItemId', () => {
    it('should return price history for diamond sword with multiple traders', async () => {
      // Create multiple prices for same item
      await priceRepository.create({
        itemId: TEST_DATA.primaryItem,
        priceDiamonds: 4.00,
        tradingUnit: 'per_item' as TradingUnitType,
        isCurrent: false,
        source: 'owner',
        createdBy: TEST_DATA.mainTrader
      });

      await priceRepository.create({
        itemId: TEST_DATA.primaryItem,
        priceDiamonds: 5.50,
        tradingUnit: 'per_item' as TradingUnitType,
        isCurrent: true,
        source: 'community',
        createdBy: TEST_DATA.altTrader
      });

      const { result: history, timeMs } = await measure(async () => {
        return priceRepository.findHistoryByItemId(TEST_DATA.primaryItem);
      });

      expectFastExecution(timeMs, 10);
      expect(history).toHaveLength(2);
      
      // Verify both prices are present, order guaranteed by implementation
      const prices = history.map(p => p.priceDiamonds).sort((a, b) => b - a);
      expect(prices).toEqual([5.50, 4.00]);
      
      // Verify traders
      const traders = history.map(p => p.createdBy).sort();
      expect(traders).toEqual([TEST_DATA.altTrader, TEST_DATA.mainTrader]);
    });

    it('should return empty array for item with no prices', async () => {
      const { result: history, timeMs } = await measure(async () => {
        return priceRepository.findHistoryByItemId(TEST_DATA.enchantedItem);
      });

      expectFastExecution(timeMs, 5);
      expect(history).toEqual([]);
    });
  });

  describe('updateCurrentPrice', () => {
    it('should update iron pickaxe price from steve to alex', async () => {
      // Create initial current price by steve
      await priceRepository.create({
        itemId: TEST_DATA.secondaryItem,
        priceDiamonds: 4.00,
        tradingUnit: 'per_item' as TradingUnitType,
        isCurrent: true,
        source: 'owner',
        createdBy: TEST_DATA.mainTrader
      });

      // Update with new current price by alex
      const { result: updatedPrice, timeMs } = await measure(async () => {
        return priceRepository.updateCurrentPrice(TEST_DATA.secondaryItem, {
          priceDiamonds: 6.00,
          tradingUnit: 'per_stack' as TradingUnitType,
          source: 'community',
          createdBy: TEST_DATA.altTrader
        });
      });

      expectFastExecution(timeMs, 10);
      expect(updatedPrice.priceDiamonds).toBe(6.00);
      expect(updatedPrice.tradingUnit).toBe('per_stack');
      expect(updatedPrice.isCurrent).toBe(true);
      expect(updatedPrice.createdBy).toBe(TEST_DATA.altTrader);

      // Verify old price is marked as non-current
      const history = await priceRepository.findHistoryByItemId(TEST_DATA.secondaryItem);
      expect(history).toHaveLength(2);
      
      const oldPrice = history.find(p => p.priceDiamonds === 4.00);
      expect(oldPrice?.isCurrent).toBe(false);
      expect(oldPrice?.createdBy).toBe(TEST_DATA.mainTrader);
    });

    it('should validate nonexistent item update with fast execution', async () => {
      const { timeMs } = await measure(async () => {
        try {
          await priceRepository.updateCurrentPrice('minecraft:nonexistent_item', {
            priceDiamonds: 6.00,
            tradingUnit: 'per_item' as TradingUnitType,
            source: 'owner',
            createdBy: TEST_DATA.mainTrader
          });
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.name).toBe('PriceValidationError');
          expect(error.code).toBe('PRICE_NOT_FOUND');
        }
      });

      expectFastExecution(timeMs, 5);
    });
  });

  describe('findByTradingUnit', () => {
    it('should filter prices by trading unit with steve and alex items', async () => {
      await priceRepository.create({
        itemId: TEST_DATA.primaryItem,
        priceDiamonds: 5.00,
        tradingUnit: 'per_item' as TradingUnitType,
        isCurrent: true,
        source: 'owner',
        createdBy: TEST_DATA.mainTrader
      });

      await priceRepository.create({
        itemId: TEST_DATA.secondaryItem,
        priceDiamonds: 320.00,
        tradingUnit: 'per_stack' as TradingUnitType,
        isCurrent: true,
        source: 'owner',
        createdBy: TEST_DATA.altTrader
      });

      const { result: stackPrices, timeMs } = await measure(async () => {
        return priceRepository.findByTradingUnit('per_stack');
      });

      expectFastExecution(timeMs, 10);
      expect(stackPrices).toHaveLength(1);
      expect(stackPrices[0].tradingUnit).toBe('per_stack');
      expect(stackPrices[0].priceDiamonds).toBe(320.00);
      expect(stackPrices[0].itemId).toBe(TEST_DATA.secondaryItem);
      expect(stackPrices[0].createdBy).toBe(TEST_DATA.altTrader);
    });
  });

  describe('minecraft business rules', () => {
    it('should support all trading unit types with notch admin pricing', async () => {
      const tradingUnits: TradingUnitType[] = ['per_item', 'per_stack', 'per_shulker', 'per_dozen'];
      
      const { timeMs } = await measure(async () => {
        for (const unit of tradingUnits) {
          const price = await priceRepository.create({
            itemId: `minecraft:${unit}_test`,
            priceDiamonds: 10.00,
            tradingUnit: unit,
            isCurrent: true,
            source: 'owner',
            createdBy: TEST_DATA.adminUser
          });
          expect(price.tradingUnit).toBe(unit);
          expect(price.createdBy).toBe(TEST_DATA.adminUser);
        }
      });

      expectFastExecution(timeMs, 10);
    });

    it('should allow zero price for "open to offers" diamond sword', async () => {
      const { result: price, timeMs } = await measure(async () => {
        return priceRepository.create({
          itemId: TEST_DATA.primaryItem,
          priceDiamonds: 0,
          tradingUnit: 'per_item' as TradingUnitType,
          isCurrent: true,
          source: 'owner',
          createdBy: TEST_DATA.mainTrader
        });
      });

      expectFastExecution(timeMs, 5);
      expect(price.priceDiamonds).toBe(0);
      expect(price.itemId).toBe(TEST_DATA.primaryItem);
      expect(price.createdBy).toBe(TEST_DATA.mainTrader);
    });

    it('should track price source (steve owner vs alex community)', async () => {
      const { timeMs } = await measure(async () => {
        const ownerPrice = await priceRepository.create({
          itemId: TEST_DATA.primaryItem,
          priceDiamonds: 5.00,
          tradingUnit: 'per_item' as TradingUnitType,
          isCurrent: true,
          source: 'owner',
          createdBy: TEST_DATA.mainTrader
        });

        const communityPrice = await priceRepository.create({
          itemId: TEST_DATA.secondaryItem,
          priceDiamonds: 4.50,
          tradingUnit: 'per_item' as TradingUnitType,
          isCurrent: true,
          source: 'community',
          createdBy: TEST_DATA.altTrader
        });

        expect(ownerPrice.source).toBe('owner');
        expect(ownerPrice.createdBy).toBe(TEST_DATA.mainTrader);
        expect(communityPrice.source).toBe('community');
        expect(communityPrice.createdBy).toBe(TEST_DATA.altTrader);
      });

      expectFastExecution(timeMs, 10);
    });
  });
});