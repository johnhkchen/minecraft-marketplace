#!/usr/bin/env tsx

/**
 * Automatic Slow Test Fixer
 * 
 * Applies fast testing patterns to identified slow tests:
 * - Adds performance validation
 * - Converts hardcoded data to configurable factories
 * - Adds MSW imports where needed
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface FixStats {
  filesFixed: number;
  performanceValidationAdded: number;
  factoriesAdded: number;
  mswImportsAdded: number;
}

class SlowTestFixer {
  private stats: FixStats = {
    filesFixed: 0,
    performanceValidationAdded: 0,
    factoriesAdded: 0,
    mswImportsAdded: 0
  };

  async fixSlowTests(): Promise<void> {
    console.log('🔧 Fixing slow tests automatically...\n');

    // Get list of test files that need fixing
    const testFiles = this.findTestFiles('tests');
    
    for (const file of testFiles) {
      if (this.shouldFixFile(file)) {
        await this.fixTestFile(file);
      }
    }

    this.printStats();
  }

  private findTestFiles(dir: string): string[] {
    const { readdirSync, statSync } = require('fs');
    const files: string[] = [];
    
    if (!existsSync(dir)) return files;
    
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findTestFiles(fullPath));
      } else if (item.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private shouldFixFile(file: string): boolean {
    // Skip already fast files
    if (file.includes('.fast.') || file.includes('refactored') || file.includes('temporal-decoupling')) {
      return false;
    }

    // Focus on unit tests that need fixing
    return file.includes('/unit/') || file.includes('/database/');
  }

  private async fixTestFile(file: string): Promise<void> {
    const content = readFileSync(file, 'utf8');
    let newContent = content;
    let hasChanges = false;

    // 1. Add performance validation for missing expectFastExecution
    if (!content.includes('expectFastExecution') && !content.includes('performance.now')) {
      newContent = this.addPerformanceValidation(newContent);
      hasChanges = true;
      this.stats.performanceValidationAdded++;
    }

    // 2. Replace hardcoded data with configurable factories
    if (this.hasHardcodedData(content)) {
      newContent = this.replaceHardcodedData(newContent);
      hasChanges = true;
      this.stats.factoriesAdded++;
    }

    // 3. Add MSW imports if making HTTP calls without MSW
    if (this.needsMswImport(content)) {
      newContent = this.addMswImport(newContent);
      hasChanges = true;
      this.stats.mswImportsAdded++;
    }

    if (hasChanges) {
      writeFileSync(file, newContent);
      console.log(`✅ Fixed: ${file}`);
      this.stats.filesFixed++;
    }
  }

  private addPerformanceValidation(content: string): string {
    // Add import if not present
    if (!content.includes('expectFastExecution')) {
      content = content.replace(
        /import.*from ['"]vitest['"];/,
        `$&
import { expectFastExecution } from '../utils/fast-test-setup';`
      );
    }

    // Add performance validation to test blocks that don't have it
    content = content.replace(
      /it\(['"`]([^'"`]+)['"`],\s*(async\s+)?\(\)\s*=>\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g,
      (match, testName, async, testBody) => {
        if (testBody.includes('expectFastExecution') || testBody.includes('performance.now')) {
          return match;
        }

        const performanceCode = `
    const start = performance.now();
    
    ${testBody.trim()}
    
    const timeMs = performance.now() - start;
    expectFastExecution(timeMs, 10);`;

        return `it('${testName}', ${async || ''}() => {${performanceCode}
  });`;
      }
    );

    return content;
  }

  private hasHardcodedData(content: string): boolean {
    return content.includes('user_123') || 
           content.includes('item_456') || 
           content.includes('test-client-id') ||
           content.includes('"Diamond Sword"') ||
           content.includes("'testuser'");
  }

  private replaceHardcodedData(content: string): string {
    // Add test data config at the top
    if (!content.includes('TEST_DATA')) {
      const configCode = `
// CONFIGURABLE - Update for your project
const TEST_DATA = {
  userId: 'user_123',
  itemId: 'item_456',
  shopName: 'Test Shop',
  itemName: 'Diamond Sword',
  username: 'testuser'
};

`;
      content = content.replace(
        /(import.*from ['"]vitest['"];)\n/,
        `$1\n${configCode}`
      );
    }

    // Replace hardcoded values
    content = content.replace(/['"]user_123['"]/g, 'TEST_DATA.userId');
    content = content.replace(/['"]item_456['"]/g, 'TEST_DATA.itemId');
    content = content.replace(/['"]Diamond Sword['"]/g, 'TEST_DATA.itemName');
    content = content.replace(/['"]testuser['"]/g, 'TEST_DATA.username');

    return content;
  }

  private needsMswImport(content: string): boolean {
    return (content.includes('http://localhost') || content.includes('fetch(')) &&
           !content.includes('setupServer') &&
           !content.includes('MSW');
  }

  private addMswImport(content: string): string {
    // Add MSW setup import
    content = content.replace(
      /(import.*from ['"]vitest['"];)/,
      `$1
import { setupFastTests } from '../utils/fast-test-setup';

// Setup fast MSW mocking
setupFastTests();`
    );

    return content;
  }

  private printStats(): void {
    console.log('\n📊 SLOW TEST FIX SUMMARY\n');
    console.log(`✅ Files fixed: ${this.stats.filesFixed}`);
    console.log(`⏱️  Performance validation added: ${this.stats.performanceValidationAdded}`);
    console.log(`🏭 Data factories added: ${this.stats.factoriesAdded}`);
    console.log(`🌐 MSW imports added: ${this.stats.mswImportsAdded}`);
    
    if (this.stats.filesFixed > 0) {
      console.log('\n💡 Run `npm run test:speed` again to see improvements!');
    } else {
      console.log('\n🎉 No slow tests found that need automatic fixing!');
    }
  }
}

// Run the fixer
const fixer = new SlowTestFixer();
fixer.fixSlowTests().catch(console.error);