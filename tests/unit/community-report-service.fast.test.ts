/**
 * Fast Community Report Service Tests - DI Pattern
 * 
 * Testing community reporting functionality with dependency injection:
 * - Evidence-based reporting with confidence scoring
 * - Auto-approval for high-confidence stock changes
 * - Performance validation (<10ms per test)
 * - Zero external dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommunityReportService } from '../../shared/services/community-report-service.js';
import { ServiceContainer } from '../../shared/di/container.js';
import { measure, expectFastExecution } from '../utils/fast-test-setup.js';

// Minecraft domain test data
const TEST_DATA = {
  mainReporter: 'steve',
  altReporter: 'alex',
  trustedReporter: 'notch',
  items: {
    diamond_sword: 'minecraft:diamond_sword',
    iron_pickaxe: 'minecraft:iron_pickaxe',
    enchanted_book: 'minecraft:enchanted_book'
  },
  shops: {
    steve: 'steve_diamond_shop',
    alex: 'alex_iron_works',
    spawn: 'spawn_market'
  },
  reportTypes: ['stock_update', 'price_change', 'quality_issue', 'location_change'] as const
};

describe('CommunityReportService - DI Fast', () => {
  let container: ServiceContainer;
  let reportService: CommunityReportService;

  beforeEach(() => {
    container = new ServiceContainer();
    container.register('communityReportService', () => new CommunityReportService());
    reportService = container.get<CommunityReportService>('communityReportService');
  });

  describe('createReport', () => {
    it('should create basic stock update report for steve diamond sword', async () => {
      const { result, timeMs } = await measure(async () => {
        return reportService.createReport({
          item_id: TEST_DATA.items.diamond_sword,
          reporter_id: TEST_DATA.mainReporter,
          report_type: 'stock_update' as const,
          description: 'Diamond sword is out of stock at spawn market'
        });
      });

      expectFastExecution(timeMs, 10);
      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.item_id).toBe(TEST_DATA.items.diamond_sword);
      expect(result.reporter_id).toBe(TEST_DATA.mainReporter);
      expect(result.report_type).toBe('stock_update');
      expect(result.description).toContain('Diamond sword');
    });

    it('should create price change report for alex iron pickaxe', async () => {
      const { result, timeMs } = await measure(async () => {
        return reportService.createReport({
          item_id: TEST_DATA.items.iron_pickaxe,
          reporter_id: TEST_DATA.altReporter,
          report_type: 'price_change' as const,
          description: 'Iron pickaxe price increased from 32 to 40 diamonds'
        });
      });

      expectFastExecution(timeMs, 10);
      expect(result.item_id).toBe(TEST_DATA.items.iron_pickaxe);
      expect(result.reporter_id).toBe(TEST_DATA.altReporter);
      expect(result.report_type).toBe('price_change');
      expect(result.status).toBe('pending');
      expect(result.description).toContain('32 to 40 diamonds');
    });

    it('should handle quality issue report with fast execution', async () => {
      const { result, timeMs } = await measure(async () => {
        return reportService.createReport({
          item_id: TEST_DATA.items.enchanted_book,
          reporter_id: TEST_DATA.mainReporter,
          report_type: 'quality_issue' as const,
          description: 'Enchanted book missing Sharpness V enchantment as advertised'
        });
      });

      expectFastExecution(timeMs, 5);
      expect(result.report_type).toBe('quality_issue');
      expect(result.description).toContain('Sharpness V');
      expect(result.status).toBe('pending');
    });
  });

  describe('createReportWithHistory', () => {
    it('should auto-approve high-confidence stock update from trusted notch', async () => {
      const reportData = {
        item_id: TEST_DATA.items.diamond_sword,
        reporter_id: TEST_DATA.trustedReporter,
        report_type: 'stock_update' as const,
        description: 'Diamond sword back in stock at notch admin shop'
      };

      // Mock trusted reporter (>5 approved reports per SPEC)
      const reporterHistory = {
        approved_reports: 8,
        total_reports: 10
      };

      const { result, timeMs } = await measure(async () => {
        return reportService.createReportWithHistory(reportData, reporterHistory);
      });

      expectFastExecution(timeMs, 10);
      expect(result.status).toBe('auto_approved');
      expect(result.confidence_level).toBe('high');
      expect(result.reporter_id).toBe(TEST_DATA.trustedReporter);
      expect(result.item_id).toBe(TEST_DATA.items.diamond_sword);
    });

    it('should require manual review for new reporter alex', async () => {
      const reportData = {
        item_id: TEST_DATA.items.iron_pickaxe,
        reporter_id: TEST_DATA.altReporter,
        report_type: 'price_change' as const,
        description: 'Iron pickaxe price dropped to 28 diamonds'
      };

      // Mock new reporter (few approved reports)
      const reporterHistory = {
        approved_reports: 2,
        total_reports: 3
      };

      const { result, timeMs } = await measure(async () => {
        return reportService.createReportWithHistory(reportData, reporterHistory);
      });

      expectFastExecution(timeMs, 10);
      expect(result.status).toBe('pending');
      expect(result.confidence_level).toBe('medium');
      expect(result.reporter_id).toBe(TEST_DATA.altReporter);
    });

    it('should require manual review for unreliable reporter herobrine', async () => {
      const reportData = {
        item_id: TEST_DATA.items.enchanted_book,
        reporter_id: 'herobrine',
        report_type: 'quality_issue' as const,
        description: 'This item is cursed and should be removed'
      };

      // Mock unreliable reporter (low approval rate, not stock_update)
      const reporterHistory = {
        approved_reports: 1,
        total_reports: 10
      };

      const { result, timeMs } = await measure(async () => {
        return reportService.createReportWithHistory(reportData, reporterHistory);
      });

      expectFastExecution(timeMs, 5);
      expect(result.status).toBe('pending'); // Default status per implementation
      expect(result.confidence_level).toBe('medium'); // Default confidence per implementation
      expect(result.reporter_id).toBe('herobrine');
    });
  });

  describe('minecraft marketplace business rules', () => {
    it('should support all report types with performance tracking', async () => {
      const { timeMs } = await measure(async () => {
        for (const reportType of TEST_DATA.reportTypes) {
          const result = await reportService.createReport({
            item_id: TEST_DATA.items.diamond_sword,
            reporter_id: TEST_DATA.mainReporter,
            report_type: reportType,
            description: `Test ${reportType} report for diamond sword`
          });
          
          expect(result.report_type).toBe(reportType);
          expect(result.status).toBe('pending');
        }
      });

      expectFastExecution(timeMs, 15);
    });

    it('should handle minecraft shop location changes from steve to alex', async () => {
      const { result, timeMs } = await measure(async () => {
        return reportService.createReport({
          item_id: TEST_DATA.items.diamond_sword,
          reporter_id: TEST_DATA.mainReporter,
          report_type: 'location_change' as const,
          description: `Diamond sword moved from ${TEST_DATA.shops.steve} to ${TEST_DATA.shops.alex}`
        });
      });

      expectFastExecution(timeMs, 10);
      expect(result.report_type).toBe('location_change');
      expect(result.description).toContain(TEST_DATA.shops.steve);
      expect(result.description).toContain(TEST_DATA.shops.alex);
    });

    it('should validate confidence scoring for minecraft community stock updates', async () => {
      const testCases = [
        { approvedReports: 10, totalReports: 12, reportType: 'stock_update' as const, expectedConfidence: 'high', expectedStatus: 'auto_approved' },
        { approvedReports: 8, totalReports: 10, reportType: 'stock_update' as const, expectedConfidence: 'high', expectedStatus: 'auto_approved' },
        { approvedReports: 5, totalReports: 8, reportType: 'stock_update' as const, expectedConfidence: 'medium', expectedStatus: 'pending' },
        { approvedReports: 10, totalReports: 12, reportType: 'price_change' as const, expectedConfidence: 'medium', expectedStatus: 'pending' }
      ];

      const { timeMs } = await measure(async () => {
        for (const testCase of testCases) {
          const result = await reportService.createReportWithHistory({
            item_id: TEST_DATA.items.diamond_sword,
            reporter_id: TEST_DATA.mainTrader,
            report_type: testCase.reportType,
            description: `${testCase.reportType} test`
          }, {
            approved_reports: testCase.approvedReports,
            total_reports: testCase.totalReports
          });
          
          expect(result.confidence_level).toBe(testCase.expectedConfidence);
          expect(result.status).toBe(testCase.expectedStatus);
        }
      });

      expectFastExecution(timeMs, 15);
    });

    it('should handle minecraft item naming consistently', async () => {
      const minecraftItems = [
        TEST_DATA.items.diamond_sword,
        TEST_DATA.items.iron_pickaxe,
        TEST_DATA.items.enchanted_book
      ];

      const { timeMs } = await measure(async () => {
        for (const itemId of minecraftItems) {
          const result = await reportService.createReport({
            item_id: itemId,
            reporter_id: TEST_DATA.mainReporter,
            report_type: 'stock_update' as const,
            description: `Stock update for ${itemId}`
          });
          
          expect(result.item_id).toBe(itemId);
          expect(result.item_id).toMatch(/^minecraft:/);
        }
      });

      expectFastExecution(timeMs, 10);
    });
  });
});