#!/usr/bin/env tsx

/**
 * Automated Performance Validation Enhancer
 * 
 * Adds performance validation to .fast.test.ts files that are missing it
 * Based on our speed analysis findings that identified 17 files without validation
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const FAST_TEST_FILES_MISSING_VALIDATION = [
  'tests/unit/production-vs-test-environment-validation.fast.test.ts',
  'tests/unit/homepage-data-55-vs-18-discrepancy.fast.test.ts',
  'tests/unit/homepage-data-debug.fast.test.ts',
  'tests/unit/environment-mismatch-detector.fast.test.ts',
  'tests/unit/information-architecture-validation.fast.test.ts',
  'tests/unit/homepage-ssr-root-cause.fast.test.ts',
  'tests/unit/url-service-debug.fast.test.ts',
  'tests/unit/auto-environment-integration.fast.test.ts',
  'tests/unit/url-construction-bug.fast.test.ts',
  'tests/unit/homepage-data-fix-guide.fast.test.ts',
  'tests/unit/homepage-data-simple.fast.test.ts',
  'tests/unit/ssr-url-construction-bug.fast.test.ts',
  'tests/unit/api-failure-patterns.fast.test.ts',
  'tests/unit/homepage-api-root-cause.fast.test.ts'
];

class PerformanceValidationEnhancer {
  private processed = 0;
  private skipped = 0;
  private errors = 0;

  async enhanceAllFiles(): Promise<void> {
    console.log('🚀 AUTOMATED PERFORMANCE VALIDATION ENHANCEMENT');
    console.log('===============================================\n');
    console.log(`📋 Processing ${FAST_TEST_FILES_MISSING_VALIDATION.length} .fast.test.ts files...\n`);

    for (const filePath of FAST_TEST_FILES_MISSING_VALIDATION) {
      await this.enhanceFile(filePath);
    }

    this.generateReport();
  }

  private async enhanceFile(filePath: string): Promise<void> {
    console.log(`🔍 Processing: ${filePath}`);

    if (!existsSync(filePath)) {
      console.log(`   ⚠️  File not found, skipping`);
      this.skipped++;
      return;
    }

    try {
      const content = readFileSync(filePath, 'utf8');
      
      // Check if already has performance validation
      if (content.includes('expectFastExecution')) {
        console.log(`   ✅ Already has performance validation`);
        this.skipped++;
        return;
      }

      const enhancedContent = this.addPerformanceValidation(content, filePath);
      
      if (enhancedContent !== content) {
        writeFileSync(filePath, enhancedContent);
        console.log(`   ✅ Enhanced with performance validation`);
        this.processed++;
      } else {
        console.log(`   ⚠️  No test functions found to enhance`);
        this.skipped++;
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      this.errors++;
    }

    console.log('');
  }

  private addPerformanceValidation(content: string, filePath: string): string {
    let updatedContent = content;

    // Add import if missing
    if (!content.includes('expectFastExecution')) {
      // Find existing imports and add performance validation import
      const importMatch = content.match(/import.*from ['"].*fast-test-setup['"]/);
      if (importMatch) {
        // Update existing import to include expectFastExecution
        updatedContent = updatedContent.replace(
          /import\s*{\s*([^}]*)\s*}\s*from\s*['"][^'"]*fast-test-setup['"]/,
          (match, imports) => {
            if (!imports.includes('expectFastExecution')) {
              const cleanImports = imports.split(',').map(i => i.trim()).filter(i => i);
              cleanImports.push('expectFastExecution');
              return `import { ${cleanImports.join(', ')} } from '../utils/fast-test-setup.js'`;
            }
            return match;
          }
        );
      } else {
        // Add new import after existing imports
        const lastImportMatch = updatedContent.match(/^import.*$/gm);
        if (lastImportMatch) {
          const lastImport = lastImportMatch[lastImportMatch.length - 1];
          updatedContent = updatedContent.replace(
            lastImport,
            `${lastImport}\nimport { expectFastExecution } from '../utils/fast-test-setup.js';`
          );
        }
      }
    }

    // Find and enhance test functions
    const testPattern = /(test|it)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(async\s+)?\(\s*[^)]*\)\s*=>\s*\{/g;
    
    updatedContent = updatedContent.replace(testPattern, (match, testKeyword, testName, asyncKeyword) => {
      // Add performance measurement wrapper
      const performanceStart = '  const start = performance.now();\n  ';
      const replacement = match.replace('{', `{\n${performanceStart}`);
      return replacement;
    });

    // Add performance validation before closing braces of test functions
    // This is a simplified approach - in practice, you'd want more sophisticated parsing
    const testFunctionPattern = /(test|it)\s*\([^{]*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    
    updatedContent = updatedContent.replace(testFunctionPattern, (match, testKeyword, testBody) => {
      if (!testBody.includes('expectFastExecution') && testBody.includes('performance.now()')) {
        // Add performance validation before the closing brace
        const enhancedBody = testBody.trimEnd() + '\n  \n  const timeMs = performance.now() - start;\n  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms\n';
        return match.replace(testBody, enhancedBody);
      }
      return match;
    });

    return updatedContent;
  }

  private generateReport(): void {
    console.log('📊 PERFORMANCE VALIDATION ENHANCEMENT REPORT');
    console.log('============================================\n');
    
    console.log(`✅ Successfully Enhanced: ${this.processed} files`);
    console.log(`⚠️  Skipped: ${this.skipped} files`);
    console.log(`❌ Errors: ${this.errors} files`);
    console.log(`📊 Total Processed: ${this.processed + this.skipped + this.errors} files\n`);

    if (this.processed > 0) {
      console.log('🎯 IMPACT:');
      console.log(`   • ${this.processed} .fast.test.ts files now have performance validation`);
      console.log(`   • All tests will enforce <10ms execution target`);
      console.log(`   • Performance regressions will be caught automatically\n`);
    }

    if (this.errors > 0) {
      console.log('⚠️  Some files had errors and may need manual attention.\n');
    }

    console.log('💡 NEXT STEPS:');
    console.log('   1. Run: npm run test:fast -- to validate all enhanced tests');
    console.log('   2. Run: npm run test:speed -- to verify performance improvements');
    console.log('   3. Fix any tests that exceed 10ms target with MSW mocking');
  }
}

// Run the enhancer
const enhancer = new PerformanceValidationEnhancer();
enhancer.enhanceAllFiles().catch(console.error);