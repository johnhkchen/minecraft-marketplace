#!/usr/bin/env tsx

/**
 * Test Speed Analysis - Identifies slow tests and misclassified tests
 * 
 * Analyzes test execution times and flags tests that:
 * - Run too slow for their designated category
 * - Should be moved to a different speed category
 * - Are infrastructure-dependent when they should be unit tests
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Speed category limits (in milliseconds)
const SPEED_LIMITS = {
  unit: { max: 10, target: 5, category: 'Unit Tests' },
  fast: { max: 50, target: 10, category: 'Fast Tests' },
  integration: { max: 500, target: 200, category: 'Integration Tests' },
  e2e: { max: 10000, target: 5000, category: 'E2E Tests' },
  collaboration: { max: 1000, target: 300, category: 'Collaboration Tests' },
  performance: { max: 2000, target: 1000, category: 'Performance Tests' },
  security: { max: 500, target: 200, category: 'Security Tests' },
  api: { max: 200, target: 100, category: 'API Tests' },
  database: { max: 1000, target: 500, category: 'Database Tests' },
  validation: { max: 100, target: 50, category: 'Validation Tests' }
} as const;

interface TestResult {
  file: string;
  category: string;
  duration: number;
  testCount: number;
  avgPerTest: number;
  issues: string[];
}

interface SlowTest {
  name: string;
  duration: number;
  limit: number;
  severity: 'warning' | 'error';
}

class TestSpeedAnalyzer {
  private results: TestResult[] = [];
  private slowTests: SlowTest[] = [];
  private skippedCategories: Array<{
    name: string;
    testFiles: number;
    testCount: number;
    status: 'available' | 'unavailable' | 'empty';
    issues: string[];
  }> = [];

  async analyzeTestSpeeds(): Promise<void> {
    console.log('🔍 Analyzing test speeds across all categories...\n');

    // Run different test categories and capture timing
    await this.analyzeCategory('fast', 'npx vitest run --config vitest.fast.config.ts');
    await this.analyzeCategory('unit', 'npx vitest run --config vitest.unit.config.ts');
    
    // Include collaboration tests in analysis (these work well)
    if (this.commandExists('npm run test:collaboration')) {
      await this.analyzeCategory('collaboration', 'npm run test:collaboration');
    }

    // Analyze infrastructure-dependent tests for completeness
    await this.analyzeSkippedCategories();

    this.analyzeTestFiles();
    this.generateReport();
  }

  private async analyzeCategory(category: string, command: string): Promise<void> {
    try {
      // Check if category exists in SPEED_LIMITS
      const limits = SPEED_LIMITS[category as keyof typeof SPEED_LIMITS];
      if (!limits) {
        console.log(`   ⚠️  Unknown test category: ${category}\n`);
        return;
      }

      console.log(`⏱️  Running ${limits.category}...`);
      
      const startTime = Date.now();
      const output = execSync(command, { 
        encoding: 'utf8', 
        timeout: 60000, // Increased timeout for comprehensive tests
        stdio: 'pipe'
      }).toString();
      const duration = Date.now() - startTime;

      // Parse vitest output for test count and individual test times
      const testCount = this.parseTestCount(output);
      const avgPerTest = testCount > 0 ? duration / testCount : duration;

      const result: TestResult = {
        file: category,
        category: limits.category,
        duration,
        testCount,
        avgPerTest,
        issues: []
      };

      // Check if category exceeds its limits
      if (duration > limits.max * testCount) {
        result.issues.push(`Exceeds ${limits.category} limit (${limits.max}ms per test)`);
        this.slowTests.push({
          name: `${limits.category} Suite`,
          duration,
          limit: limits.max * testCount,
          severity: 'error'
        });
      } else if (duration > limits.target * testCount) {
        result.issues.push(`Above target (${limits.target}ms per test)`);
        this.slowTests.push({
          name: `${limits.category} Suite`,
          duration,
          limit: limits.target * testCount,
          severity: 'warning'
        });
      }

      this.results.push(result);
      console.log(`   ✅ ${testCount} tests in ${duration}ms (${avgPerTest.toFixed(1)}ms avg)\n`);

    } catch (error) {
      const limits = SPEED_LIMITS[category as keyof typeof SPEED_LIMITS];
      const categoryName = limits ? limits.category : category;
      
      // Try to extract partial results even from failed runs
      if (error instanceof Error && error.message.includes('Command failed:')) {
        const errorOutput = error.message;
        const testCount = this.parseTestCount(errorOutput);
        
        if (testCount > 0) {
          console.log(`   ⚠️  ${categoryName} partially failed but processed ${testCount} tests`);
          
          // Still record partial results for analysis
          const result: TestResult = {
            file: category,
            category: limits.category,
            duration: 0, // Unknown duration for failed runs
            testCount,
            avgPerTest: 0,
            issues: [`${categoryName} had test failures - see logs above`]
          };
          
          this.results.push(result);
          console.log(`   📊 Analyzed ${testCount} tests (with failures)\n`);
          return;
        }
      }
      
      console.log(`   ⚠️  ${categoryName} not available or failed`);
      if (process.env.DEBUG_TESTS) {
        console.log(`   Debug: ${error}`);
      }
      console.log('');
    }
  }

  private analyzeTestFiles(): void {
    console.log('📁 Analyzing individual test files for misclassification...\n');

    // Find all test files and analyze their patterns
    const testFiles = this.findTestFiles('tests');
    
    for (const file of testFiles) {
      if (!existsSync(file)) continue;
      
      const content = readFileSync(file, 'utf8');
      const issues = this.analyzeTestFile(file, content);
      
      if (issues.length > 0) {
        this.results.push({
          file,
          category: this.categorizeTestFile(file),
          duration: 0, // File analysis, not execution
          testCount: this.countTests(content),
          avgPerTest: 0,
          issues
        });
      }
    }
  }

  private findTestFiles(dir: string): string[] {
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

  private analyzeTestFile(file: string, content: string): string[] {
    const issues: string[] = [];
    
    // Check for infrastructure dependencies in unit tests
    if (file.includes('/unit/') && !file.includes('.fast.')) {
      if (content.includes('setupServer') && !content.includes('MSW')) {
        issues.push('Unit test appears to use real infrastructure instead of MSW mocking');
      }
      
      if (content.includes('beforeAll') && content.includes('container')) {
        issues.push('Unit test appears to start containers (should be integration test)');
      }
      
      if (content.includes('await new') && content.includes('Container')) {
        issues.push('Unit test uses testcontainers (should be integration test)');
      }
      
      if (content.includes('http://localhost') && !content.includes('MSW')) {
        issues.push('Unit test makes real HTTP calls (should use MSW or be integration test)');
      }
    }

    // Check for MSW mocking in integration tests
    if (file.includes('/integration/')) {
      if (content.includes('setupServer') && content.includes('msw')) {
        issues.push('Integration test uses MSW mocking (should be unit test or use real services)');
      }
    }

    // Check for missing performance validation
    if (file.includes('.fast.') || file.includes('/unit/')) {
      if (!content.includes('expectFastExecution') && !content.includes('performance.now')) {
        issues.push('Fast test missing performance validation');
      }
    }

    // Check for hardcoded temporal data
    if (content.includes('user_123') || content.includes('item_456') || content.includes('test-client-id')) {
      if (!content.includes('TEMPORAL_') && !content.includes('TEST_DATA')) {
        issues.push('Test contains hardcoded data (should use configurable factories)');
      }
    }

    return issues;
  }

  private categorizeTestFile(file: string): string {
    if (file.includes('/unit/')) return 'Unit Tests';
    if (file.includes('/integration/')) return 'Integration Tests';
    if (file.includes('/e2e/')) return 'E2E Tests';
    if (file.includes('/collaboration/')) return 'Collaboration Tests';
    if (file.includes('/performance/')) return 'Performance Tests';
    if (file.includes('/security/')) return 'Security Tests';
    if (file.includes('/api/')) return 'API Tests';
    if (file.includes('/database/')) return 'Database Tests';
    if (file.includes('.fast.')) return 'Fast Tests';
    return 'Unknown';
  }

  private parseTestCount(output: string): number {
    // Parse vitest output like "Tests  75 passed (75)" or "Test Files  X passed"
    const testsMatch = output.match(/Tests\s+(\d+)\s+passed/);
    if (testsMatch) {
      return parseInt(testsMatch[1], 10);
    }
    
    // Alternative pattern: count individual test lines
    const testLines = output.match(/✓.*\(\d+\s+tests?\)/g);
    if (testLines) {
      return testLines.reduce((total, line) => {
        const count = line.match(/\((\d+)\s+tests?\)/);
        return total + (count ? parseInt(count[1], 10) : 0);
      }, 0);
    }
    
    return 0;
  }

  private countTests(content: string): number {
    // Count "it(" and "test(" occurrences
    const itMatches = content.match(/\bit\s*\(/g) || [];
    const testMatches = content.match(/\btest\s*\(/g) || [];
    return itMatches.length + testMatches.length;
  }

  private async analyzeSkippedCategories(): Promise<void> {
    console.log('🔍 Analyzing infrastructure-dependent test categories for completeness...\n');

    const infrastructureCategories = [
      { key: 'integration', name: 'Integration Tests', command: 'npx vitest run --config vitest.config.ts tests/integration' },
      { key: 'e2e', name: 'E2E Tests', command: 'npx playwright test' },
      { key: 'performance', name: 'Performance Tests', command: 'npx vitest run tests/performance' },
      { key: 'security', name: 'Security Tests', command: 'npx vitest run tests/security' },
      { key: 'api', name: 'API Tests', command: 'npx vitest run tests/api' },
      { key: 'database', name: 'Database Tests', command: 'npx vitest run tests/database' },
      { key: 'validation', name: 'Validation Tests', command: 'npx vitest run tests/validation' }
    ];

    for (const category of infrastructureCategories) {
      await this.analyzeSkippedCategory(category.key, category.name, category.command);
    }
  }

  private async analyzeSkippedCategory(categoryKey: string, categoryName: string, command: string): Promise<void> {
    console.log(`📋 ${categoryName}:`);
    
    // First, check if test files exist in this category
    const categoryPath = `tests/${categoryKey}`;
    const testFiles = this.findTestFiles(categoryPath);
    
    if (testFiles.length === 0) {
      console.log(`   📁 No test files found in ${categoryPath}/`);
      console.log(`   💡 Consider creating tests or removing ${categoryName} from configuration\n`);
      
      this.skippedCategories.push({
        name: categoryName,
        testFiles: 0,
        testCount: 0,
        status: 'empty',
        issues: ['Category configured but no test files exist']
      });
      return;
    }

    console.log(`   📁 Found ${testFiles.length} test files:`);
    testFiles.forEach(file => {
      const testCount = this.countTests(readFileSync(file, 'utf8'));
      console.log(`      • ${file.replace(process.cwd() + '/', '')} (${testCount} tests)`);
    });

    // Try to get test count without running (dry run or file analysis)
    const totalTestCount = testFiles.reduce((sum, file) => {
      const content = readFileSync(file, 'utf8');
      return sum + this.countTests(content);
    }, 0);

    const categoryData = {
      name: categoryName,
      testFiles: testFiles.length,
      testCount: totalTestCount,
      status: 'unavailable' as const,
      issues: [] as string[]
    };

    // Try running with very short timeout to see if infrastructure is available
    try {
      console.log('   ⚡ Testing infrastructure availability...');
      const output = execSync(command, { 
        encoding: 'utf8', 
        timeout: 5000, // Short timeout to avoid hanging
        stdio: 'pipe'
      }).toString();
      
      const actualTestCount = this.parseTestCount(output);
      console.log(`   ✅ Infrastructure available: ${actualTestCount} tests ran successfully`);
      
      categoryData.status = 'available';
      
      if (actualTestCount !== totalTestCount) {
        console.log(`   ⚠️  Mismatch: Found ${totalTestCount} tests in files but ${actualTestCount} ran`);
        console.log(`   💡 Some tests may be skipped or disabled`);
        categoryData.issues.push(`Test count mismatch: ${totalTestCount} in files vs ${actualTestCount} ran`);
      }

    } catch (error) {
      console.log(`   ❌ Infrastructure unavailable: Cannot run ${totalTestCount} tests`);
      if (totalTestCount > 0) {
        console.log(`   💡 ${totalTestCount} tests are orphaned without infrastructure`);
        console.log(`   🔧 Consider: MSW mocking, test containers, or moving to integration suite`);
        categoryData.issues.push(`${totalTestCount} tests orphaned without infrastructure`);
      }
    }
    
    this.skippedCategories.push(categoryData);
    
    console.log('');
  }

  private commandExists(command: string): boolean {
    try {
      execSync(`${command} --help`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private generateReport(): void {
    console.log('📊 TEST SPEED ANALYSIS REPORT\n');
    console.log('=' .repeat(80));

    // Performance Summary
    console.log('\n🏃 PERFORMANCE SUMMARY\n');
    for (const result of this.results.filter(r => r.duration > 0)) {
      const status = result.issues.length === 0 ? '✅' : '⚠️';
      console.log(`${status} ${result.category}: ${result.testCount} tests in ${result.duration}ms (${result.avgPerTest.toFixed(1)}ms avg)`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   🔴 ${issue}`));
      }
    }

    // Slow Tests
    if (this.slowTests.length > 0) {
      console.log('\n🐌 SLOW TESTS DETECTED\n');
      
      const errors = this.slowTests.filter(t => t.severity === 'error');
      const warnings = this.slowTests.filter(t => t.severity === 'warning');
      
      if (errors.length > 0) {
        console.log('❌ CRITICAL - Tests exceeding limits:');
        errors.forEach(test => {
          console.log(`   ${test.name}: ${test.duration}ms (limit: ${test.limit}ms)`);
        });
        console.log('');
      }
      
      if (warnings.length > 0) {
        console.log('⚠️  WARNING - Tests above target performance:');
        warnings.forEach(test => {
          console.log(`   ${test.name}: ${test.duration}ms (target: ${test.limit}ms)`);
        });
        console.log('');
      }
    }

    // Test Classification Issues
    const classificationIssues = this.results.filter(r => r.issues.length > 0 && r.duration === 0);
    if (classificationIssues.length > 0) {
      console.log('🏷️  TEST CLASSIFICATION ISSUES\n');
      
      for (const result of classificationIssues) {
        console.log(`📁 ${result.file} (${result.category}):`);
        result.issues.forEach(issue => console.log(`   🔴 ${issue}`));
        console.log('');
      }
    }

    // Infrastructure-Dependent Test Summary
    if (this.skippedCategories.length > 0) {
      console.log('🏗️  INFRASTRUCTURE-DEPENDENT TESTS SUMMARY\n');
      
      let totalOrphanedTests = 0;
      let totalAvailableTests = 0;
      
      for (const category of this.skippedCategories) {
        const statusIcon = category.status === 'available' ? '✅' : 
                          category.status === 'empty' ? '📁' : '❌';
        
        console.log(`${statusIcon} ${category.name}: ${category.testFiles} files, ${category.testCount} tests`);
        
        if (category.status === 'available') {
          totalAvailableTests += category.testCount;
        } else if (category.status === 'unavailable' && category.testCount > 0) {
          totalOrphanedTests += category.testCount;
        }
        
        if (category.issues.length > 0) {
          category.issues.forEach(issue => console.log(`   🔴 ${issue}`));
        }
      }
      
      console.log('');
      
      if (totalOrphanedTests > 0) {
        console.log(`⚠️  ORPHANED TESTS DETECTED: ${totalOrphanedTests} tests cannot run without infrastructure`);
        console.log('💡 Consider these solutions:');
        console.log('   1. Convert to fast tests with MSW mocking');
        console.log('   2. Set up test containers for consistent infrastructure');
        console.log('   3. Move to integration test category with proper setup');
        console.log('   4. Remove if tests are redundant or obsolete\n');
      }
      
      if (totalAvailableTests > 0) {
        console.log(`✅ ${totalAvailableTests} infrastructure-dependent tests are available and working\n`);
      }
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS\n');
    
    const totalFastTests = this.results.find(r => r.category.includes('Fast'))?.testCount || 0;
    const totalUnitTests = this.results.find(r => r.category.includes('Unit'))?.testCount || 0;
    const totalRunnableTests = this.results.reduce((sum, r) => sum + r.testCount, 0);
    const totalOrphanedTests = this.skippedCategories.reduce((sum, cat) => 
      cat.status === 'unavailable' ? sum + cat.testCount : sum, 0);
    const totalTests = totalRunnableTests + totalOrphanedTests;
    
    if (totalFastTests < totalRunnableTests * 0.7) {
      console.log('📈 Consider converting more tests to fast MSW-mocked tests');
      console.log(`   Current: ${totalFastTests}/${totalRunnableTests} runnable tests are fast (${(totalFastTests/totalRunnableTests*100).toFixed(1)}%)`);
      console.log(`   Total coverage: ${totalFastTests}/${totalTests} all tests (${(totalFastTests/totalTests*100).toFixed(1)}%)`);
      console.log(`   Target: 70%+ tests should be fast for optimal development experience\n`);
    }
    
    if (totalOrphanedTests > 0) {
      console.log(`🚨 ADDRESS ORPHANED TESTS: ${totalOrphanedTests} tests (${(totalOrphanedTests/totalTests*100).toFixed(1)}% of total) cannot run`);
      console.log(`   This reduces effective test coverage from ${totalTests} to ${totalRunnableTests} tests\n`);
    }
    
    if (this.slowTests.length > 0) {
      console.log('⚡ Apply fast testing patterns to slow tests:');
      console.log('   1. Use MSW mocking instead of real infrastructure');
      console.log('   2. Separate test data from test logic');
      console.log('   3. Add performance validation with expectFastExecution()');
      console.log('   4. Move infrastructure-dependent tests to integration category\n');
    }
    
    if (classificationIssues.length > 0) {
      console.log('🔧 Fix test classification issues:');
      console.log('   1. Move container/database tests to tests/integration/');
      console.log('   2. Move MSW-mocked tests to tests/unit/ with .fast. suffix');
      console.log('   3. Add TEMPORAL_ config for hardcoded test data');
      console.log('   4. Add performance validation for all fast tests\n');
    }

    // Success criteria
    const fastTestsGood = this.results.filter(r => r.category.includes('Fast')).every(r => r.issues.length === 0);
    const noSlowTests = this.slowTests.filter(t => t.severity === 'error').length === 0;
    const noClassificationIssues = classificationIssues.length === 0;
    
    console.log('=' .repeat(80));
    if (fastTestsGood && noSlowTests && noClassificationIssues) {
      console.log('🎉 ALL TESTS MEET SPEED REQUIREMENTS! Ready for rapid development.');
    } else {
      console.log('⚡ Speed improvements needed. Run fixes above for optimal performance.');
    }
    console.log('=' .repeat(80));
  }
}

// Run the analysis
const analyzer = new TestSpeedAnalyzer();
analyzer.analyzeTestSpeeds().catch(console.error);