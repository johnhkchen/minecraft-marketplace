#!/usr/bin/env tsx

/**
 * Enhanced Test Speed Analysis with Vitest Profiling
 * 
 * Uses Vitest's built-in profiling capabilities to identify:
 * - Bottom quintile (slowest 20%) of tests
 * - Tests exceeding slowTestThreshold 
 * - Performance bottlenecks in Node.js/Vitest ecosystem
 * - Specific optimization recommendations
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs';
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

interface IndividualTestTiming {
  name: string;
  file: string;
  duration: number;
  category: string;
  issues: string[];
}

class EnhancedTestSpeedAnalyzer {
  private results: TestResult[] = [];
  private slowTests: SlowTest[] = [];
  private individualTests: IndividualTestTiming[] = [];
  private slowTestThreshold = 300; // Vitest default
  private skippedCategories: Array<{
    name: string;
    testFiles: number;
    testCount: number;
    status: 'available' | 'unavailable' | 'empty';
    issues: string[];
  }> = [];

  async analyzeTestSpeeds(): Promise<void> {
    console.log('🔍 FOCUSED PERFORMANCE CULPRIT ANALYSIS\n');
    console.log('🎯 Goal: Identify which testing techniques cause the most slowdown\n');
    
    // Step 1: Quick profiling of main test suite
    await this.runQuickProfiling();
    
    // Step 2: Deep dive into file-level performance patterns  
    await this.analyzeFilePerformancePatterns();
    
    // Step 3: Pattern analysis - what techniques cause slowness?
    await this.analyzeTechniqueCulprits();
    
    // Step 4: Identify bottom quintile of slowest techniques
    await this.identifyBottomQuintile();

    // Step 5: Quick infrastructure analysis
    await this.analyzeSkippedCategories();

    // Step 6: Static analysis for anti-patterns
    this.analyzeTestFiles();
    
    // Step 7: Generate focused report on technique culprits
    this.generateTechniqueReport();
  }

  private async runQuickProfiling(): Promise<void> {
    console.log('⏱️  STEP 1: Quick Performance Profiling');
    console.log('📊 Sampling main test suite for baseline performance...\n');
    
    try {
      console.log('   🔍 Running: npm run test:fast (baseline)');
      const startTime = Date.now();
      const output = execSync('npm run test:fast', { 
        encoding: 'utf-8', 
        timeout: 45000, // Reasonable timeout
        stdio: 'pipe'
      });
      const duration = Date.now() - startTime;
      
      console.log(`      ⏱️  Total execution: ${duration}ms`);
      this.parseVitestProfiling(output, 'baseline');
      
    } catch (error: any) {
      console.log('      ⚠️  Partial execution, extracting data...');
      if (error.stdout) {
        this.parseVitestProfiling(error.stdout, 'baseline');
      }
    }
    
    console.log(`   ✅ Captured performance data: ${this.individualTests.length} measurements\n`);
  }

  private async runComprehensiveVitestProfiling(): Promise<void> {
    console.log('⏱️  STEP 1: Comprehensive Vitest Profiling');
    console.log('📊 Running multiple test configurations to capture performance patterns...\n');
    
    const profilingCommands = [
      {
        name: 'Fast Tests (MSW Mocked)',
        command: 'npm run test:fast -- --reporter=verbose --slow-test-threshold=100',
        expectedPattern: 'MSW mocking with fast execution'
      },
      {
        name: 'Fast Tests (JSON Reporter)',
        command: 'npm run test:fast -- --reporter=json --slow-test-threshold=100',
        expectedPattern: 'Structured performance data'
      },
      {
        name: 'Fast Tests (Basic)',
        command: 'npm run test:fast',
        expectedPattern: 'Default configuration baseline'
      }
    ];
    
    for (const config of profilingCommands) {
      console.log(`   🔍 ${config.name}: ${config.expectedPattern}`);
      console.log(`      Command: ${config.command}`);
      
      try {
        const startTime = Date.now();
        const output = execSync(config.command, { 
          encoding: 'utf-8', 
          timeout: 90000, // Extended timeout for comprehensive analysis
          stdio: 'pipe'
        });
        const duration = Date.now() - startTime;
        
        console.log(`      ⏱️  Execution time: ${duration}ms`);
        this.parseVitestProfiling(output, config.name);
        
      } catch (error: any) {
        console.log(`      ⚠️  Failed, extracting partial data...`);
        if (error.stdout) {
          this.parseVitestProfiling(error.stdout, config.name);
        }
        
        // Extract execution time from error if available
        const timeMatch = error.message?.match(/(\d+)ms/);
        if (timeMatch) {
          console.log(`      ⏱️  Partial execution time: ${timeMatch[1]}ms`);
        }
      }
      console.log('');
    }
    
    console.log(`   ✅ Total profiling data captured: ${this.individualTests.length} measurements\n`);
  }

  private async analyzeAllWorkingCommands(): Promise<void> {
    console.log('⏱️  STEP 2: Analyzing All Working Test Commands');
    console.log('🎯 Casting wide net to identify performance patterns...\n');
    
    // Discover all npm test commands from package.json
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const testCommands = Object.entries(packageJson.scripts || {})
      .filter(([key, value]) => key.startsWith('test:') && typeof value === 'string')
      .map(([key, value]) => ({ name: key, command: `npm run ${key}`, script: value as string }));
    
    console.log(`   📋 Found ${testCommands.length} test commands to analyze:`);
    testCommands.forEach(cmd => {
      console.log(`      • ${cmd.name}: ${cmd.script}`);
    });
    console.log('');
    
    // Test each command to see which ones work and measure their performance
    for (const testCmd of testCommands) {
      console.log(`   🔍 Testing: ${testCmd.name}`);
      
      try {
        const startTime = Date.now();
        const output = execSync(testCmd.command, { 
          encoding: 'utf-8', 
          timeout: 30000, // Shorter timeout for discovery phase
          stdio: 'pipe'
        });
        const duration = Date.now() - startTime;
        
        // Parse test count and success metrics
        const testCount = this.parseTestCount(output);
        const avgPerTest = testCount > 0 ? duration / testCount : duration;
        
        this.results.push({
          file: testCmd.name,
          category: `Command Analysis`,
          duration,
          testCount,
          avgPerTest,
          issues: duration > 10000 ? [`Slow command: ${duration}ms for ${testCount} tests`] : []
        });
        
        console.log(`      ✅ ${testCount} tests in ${duration}ms (${avgPerTest.toFixed(1)}ms avg)`);
        
        // Also try to extract individual test data if verbose
        if (output.includes('✓') || output.includes('passed')) {
          this.parseVitestProfiling(output, testCmd.name);
        }
        
      } catch (error: any) {
        console.log(`      ❌ Failed or timed out`);
        
        // Still try to extract useful data from failed runs
        if (error.stdout) {
          const testCount = this.parseTestCount(error.stdout);
          if (testCount > 0) {
            console.log(`      📊 Partial success: ${testCount} tests detected`);
            this.parseVitestProfiling(error.stdout, testCmd.name);
          }
        }
      }
      console.log('');
    }
  }

  private async analyzeFilePerformancePatterns(): Promise<void> {
    console.log('⏱️  STEP 3: Deep File Performance Pattern Analysis');
    console.log('🔍 Analyzing individual test files for performance characteristics...\n');
    
    // Find all test files and categorize them
    const allTestFiles = this.findTestFiles('tests');
    const fileCategories = new Map<string, string[]>();
    
    // Group files by type and technique
    allTestFiles.forEach(file => {
      const category = this.categorizeTestFile(file);
      if (!fileCategories.has(category)) {
        fileCategories.set(category, []);
      }
      fileCategories.get(category)!.push(file);
    });
    
    console.log(`   📁 Analyzing ${allTestFiles.length} test files across ${fileCategories.size} categories:`);
    
    for (const [category, files] of fileCategories) {
      console.log(`\n   📂 ${category} (${files.length} files):`);
      
      // Analyze each file for performance characteristics
      const fileAnalysis = files.map(file => {
        const content = existsSync(file) ? readFileSync(file, 'utf8') : '';
        return {
          file,
          size: content.length,
          testCount: this.countTests(content),
          techniques: this.identifyTestTechniques(content),
          issues: this.analyzeTestFile(file, content)
        };
      });
      
      // Sort by potential performance impact
      fileAnalysis.sort((a, b) => {
        const aScore = a.size + (a.techniques.length * 100) + (a.issues.length * 200);
        const bScore = b.size + (b.techniques.length * 100) + (b.issues.length * 200);
        return bScore - aScore;
      });
      
      // Show top 3 most complex files per category
      fileAnalysis.slice(0, 3).forEach((analysis, index) => {
        const fileName = analysis.file.replace(process.cwd() + '/', '');
        console.log(`      ${index + 1}. ${fileName}`);
        console.log(`         Size: ${analysis.size} chars, Tests: ${analysis.testCount}`);
        console.log(`         Techniques: ${analysis.techniques.join(', ') || 'basic'}`);
        if (analysis.issues.length > 0) {
          console.log(`         Issues: ${analysis.issues.slice(0, 2).join(', ')}`);
        }
      });
    }
    
    console.log('\n   ✅ File performance analysis complete\n');
  }

  private identifyTestTechniques(content: string): string[] {
    const techniques: string[] = [];
    
    // Infrastructure techniques
    if (content.includes('setupServer') || content.includes('msw')) techniques.push('MSW-mocking');
    if (content.includes('testcontainers') || content.includes('Container')) techniques.push('testcontainers');
    if (content.includes('docker') || content.includes('compose')) techniques.push('docker');
    if (content.includes('beforeAll') && content.includes('container')) techniques.push('container-setup');
    
    // Performance techniques
    if (content.includes('performance.now') || content.includes('expectFastExecution')) techniques.push('performance-validation');
    if (content.includes('concurrent') || content.includes('parallel')) techniques.push('concurrent-execution');
    if (content.includes('timeout') || content.includes('waitFor')) techniques.push('timeouts');
    
    // Data techniques
    if (content.includes('faker') || content.includes('@faker-js')) techniques.push('faker-data');
    if (content.includes('TEMPORAL_') || content.includes('TEST_DATA')) techniques.push('configurable-data');
    if (content.includes('user_123') || content.includes('hardcoded')) techniques.push('hardcoded-data');
    
    // Integration techniques
    if (content.includes('fetch') || content.includes('http')) techniques.push('http-requests');
    if (content.includes('database') || content.includes('postgres')) techniques.push('database-integration');
    if (content.includes('playwright') || content.includes('page.')) techniques.push('browser-automation');
    
    // Test framework techniques
    if (content.includes('describe.each') || content.includes('test.each')) techniques.push('parameterized-tests');
    if (content.includes('beforeEach') || content.includes('afterEach')) techniques.push('test-hooks');
    if (content.includes('mock') || content.includes('jest.')) techniques.push('mocking');
    
    return techniques;
  }

  private async analyzeTechniqueCulprits(): Promise<void> {
    console.log('⏱️  STEP 5: Technique-Level Performance Culprit Analysis');
    console.log('🕵️  Identifying which testing techniques cause the most slowdown...\n');
    
    // Group individual tests by techniques used
    const techniquePerformance = new Map<string, { 
      tests: IndividualTestTiming[], 
      avgDuration: number, 
      maxDuration: number,
      fileCount: number 
    }>();
    
    // Analyze all test files to map techniques to performance
    const allTestFiles = this.findTestFiles('tests');
    allTestFiles.forEach(file => {
      if (!existsSync(file)) return;
      
      const content = readFileSync(file, 'utf8');
      const techniques = this.identifyTestTechniques(content);
      const testCount = this.countTests(content);
      
      // Find corresponding performance data for this file
      const fileTests = this.individualTests.filter(test => test.file.includes(file) || file.includes(test.file));
      
      // If no direct performance data, estimate based on file characteristics
      if (fileTests.length === 0 && testCount > 0) {
        // Estimate performance based on techniques used
        let estimatedDuration = testCount * 10; // Base 10ms per test
        
        if (techniques.includes('testcontainers')) estimatedDuration *= 20;
        if (techniques.includes('docker')) estimatedDuration *= 15;
        if (techniques.includes('database-integration')) estimatedDuration *= 10;
        if (techniques.includes('browser-automation')) estimatedDuration *= 8;
        if (techniques.includes('http-requests')) estimatedDuration *= 5;
        if (techniques.includes('container-setup')) estimatedDuration *= 12;
        if (techniques.includes('MSW-mocking')) estimatedDuration *= 0.5; // MSW is faster
        
        fileTests.push({
          name: `${file} (estimated)`,
          file,
          duration: estimatedDuration,
          category: this.categorizeTestFile(file),
          issues: estimatedDuration > 1000 ? ['Estimated slow due to techniques'] : []
        });
      }
      
      // Map performance to techniques
      techniques.forEach(technique => {
        if (!techniquePerformance.has(technique)) {
          techniquePerformance.set(technique, { tests: [], avgDuration: 0, maxDuration: 0, fileCount: 0 });
        }
        
        const perfData = techniquePerformance.get(technique)!;
        perfData.tests.push(...fileTests);
        perfData.fileCount++;
      });
    });
    
    // Calculate averages and identify culprits
    console.log('   🎯 TECHNIQUE PERFORMANCE RANKING (Worst to Best):\n');
    
    const rankedTechniques = Array.from(techniquePerformance.entries())
      .map(([technique, data]) => {
        const durations = data.tests.map(t => t.duration);
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const testCount = durations.length;
        
        return {
          technique,
          avgDuration,
          maxDuration,
          testCount,
          fileCount: data.fileCount,
          slownessFactor: avgDuration / 100 // Relative to 100ms baseline
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration);
    
    rankedTechniques.forEach((data, index) => {
      const rank = index + 1;
      const impact = data.avgDuration > 1000 ? '🔴 HIGH' : 
                    data.avgDuration > 300 ? '🟡 MEDIUM' : '🟢 LOW';
      
      console.log(`   ${rank}. ${data.technique}`);
      console.log(`      ${impact} IMPACT: ${data.avgDuration.toFixed(1)}ms average`);
      console.log(`      📊 Usage: ${data.fileCount} files, ${data.testCount} tests`);
      console.log(`      ⚡ Slowness factor: ${data.slownessFactor.toFixed(1)}x baseline`);
      console.log(`      📈 Max duration: ${data.maxDuration}ms`);
      
      // Provide specific recommendations
      if (data.technique === 'testcontainers' && data.avgDuration > 1000) {
        console.log(`      💡 Recommendation: Consider MSW mocking for faster tests`);
      } else if (data.technique === 'hardcoded-data' && data.testCount > 10) {
        console.log(`      💡 Recommendation: Switch to configurable test factories`);
      } else if (data.technique === 'http-requests' && data.avgDuration > 200) {
        console.log(`      💡 Recommendation: Mock HTTP calls with MSW`);
      } else if (data.technique === 'database-integration' && data.avgDuration > 500) {
        console.log(`      💡 Recommendation: Use in-memory database or mocks`);
      }
      
      console.log('');
    });
    
    // Summary insights
    const topCulprits = rankedTechniques.slice(0, 3);
    console.log('   🏆 TOP 3 PERFORMANCE CULPRITS:');
    topCulprits.forEach((culprit, index) => {
      console.log(`      ${index + 1}. ${culprit.technique}: ${culprit.avgDuration.toFixed(1)}ms avg across ${culprit.fileCount} files`);
    });
    
    console.log('\n   ✅ Technique culprit analysis complete\n');
  }

  private parseVitestProfiling(output: string, source: string = 'vitest'): void {
    // Parse Vitest output to extract test timings and file performance data
    const lines = output.split('\n');
    let currentFile = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for Vitest test result patterns: "✓ tests/unit/filename.test.ts (123 tests) 456ms"
      const fileMatch = line.match(/✓\s+([^\s]+\.(test|spec)\.ts)\s+\((\d+)\s+tests?\)\s+(\d+)ms/);
      if (fileMatch) {
        const file = fileMatch[1];
        const testCount = parseInt(fileMatch[3], 10);
        const totalDuration = parseInt(fileMatch[4], 10);
        const avgDuration = Math.round(totalDuration / testCount);
        
        currentFile = file;
        const category = this.categorizeTestFile(file);
        
        // Add file-level timing data
        this.individualTests.push({
          name: `${file} (${testCount} tests)`,
          file: file,
          duration: totalDuration, // Use total duration for file analysis
          category,
          issues: totalDuration > this.slowTestThreshold ? ['File total exceeds slow test threshold'] : []
        });
        
        // Also add average per test for detailed analysis
        if (avgDuration > 50) { // Flag slow individual tests
          this.individualTests.push({
            name: `${file} average per test`,
            file: file,
            duration: avgDuration,
            category,
            issues: avgDuration > 100 ? ['Average per test is slow'] : []
          });
        }
        continue;
      }
      
      // Look for "Test Files X passed" pattern for overall stats
      const testFileMatch = line.match(/Test Files\s+(\d+)\s+passed/);
      if (testFileMatch) {
        const fileCount = parseInt(testFileMatch[1], 10);
        console.log(`   📁 Test files processed: ${fileCount}`);
      }
      
      // Look for "Tests X passed" pattern for test count
      const testCountMatch = line.match(/Tests\s+(\d+)\s+passed/);
      if (testCountMatch) {
        const testCount = parseInt(testCountMatch[1], 10);
        console.log(`   🧪 Individual tests processed: ${testCount}`);
      }
      
      // Look for overall timing patterns: "Duration 6.43s (transform 629ms, setup 0ms, collect 1.31s, tests 4.88s, environment 0ms, prepare 35ms)"
      const durationMatch = line.match(/Duration\s+([\d.]+)s\s+\(([^)]+)\)/);
      if (durationMatch) {
        const totalTime = parseFloat(durationMatch[1]) * 1000; // Convert to ms
        const timings = durationMatch[2];
        console.log(`   📊 Vitest timing breakdown (${totalTime}ms total): ${timings}`);
        
        // Extract specific timings for analysis
        const testsTime = timings.match(/tests\s+([\d.]+)s/);
        const transformTime = timings.match(/transform\s+(\d+)ms/);
        const collectTime = timings.match(/collect\s+([\d.]+)s/);
        
        if (testsTime) {
          const testExecutionTime = parseFloat(testsTime[1]) * 1000;
          this.individualTests.push({
            name: 'Overall test execution time',
            file: 'vitest-summary',
            duration: testExecutionTime,
            category: 'Performance Analysis',
            issues: testExecutionTime > 5000 ? ['Test execution time exceeds 5s'] : []
          });
        }
        
        if (transformTime) {
          const transformMs = parseInt(transformTime[1], 10);
          if (transformMs > 1000) {
            this.individualTests.push({
              name: 'File transformation time',
              file: 'vitest-summary',
              duration: transformMs,
              category: 'Performance Analysis',
              issues: ['Slow file transformation (>1s)']
            });
          }
        }
        
        if (collectTime) {
          const collectMs = parseFloat(collectTime[1]) * 1000;
          if (collectMs > 2000) {
            this.individualTests.push({
              name: 'Test collection time',
              file: 'vitest-summary',
              duration: collectMs,
              category: 'Performance Analysis',
              issues: ['Slow test collection (>2s)']
            });
          }
        }
      }
    }
  }

  private extractFileFromContext(lines: string[], currentLine: string): string {
    const currentIndex = lines.indexOf(currentLine);
    
    // Look backwards for file path patterns
    for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 5); i--) {
      const line = lines[i];
      if (line.includes('.test.ts') || line.includes('.spec.ts')) {
        const fileMatch = line.match(/([^\s]+\.(test|spec)\.ts)/);
        if (fileMatch) {
          return fileMatch[1];
        }
      }
    }
    
    return 'unknown';
  }

  private async identifyBottomQuintile(): Promise<void> {
    if (this.individualTests.length === 0) {
      console.log('   ⚠️  No individual test timings available for quintile analysis\n');
      return;
    }

    // Sort by duration descending
    const sortedTests = [...this.individualTests].sort((a, b) => b.duration - a.duration);
    
    // Calculate quintiles
    const quintileSize = Math.ceil(sortedTests.length / 5);
    const bottomQuintile = sortedTests.slice(0, quintileSize);
    
    console.log(`🐌 BOTTOM QUINTILE ANALYSIS (Slowest ${quintileSize} tests of ${sortedTests.length})`);
    console.log('================================================================================');
    
    bottomQuintile.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   File: ${test.file}`);
      console.log(`   Duration: ${test.duration}ms`);
      console.log(`   Category: ${test.category}`);
      
      if (test.duration > this.slowTestThreshold) {
        console.log(`   🚨 EXCEEDS THRESHOLD: ${test.duration}ms > ${this.slowTestThreshold}ms`);
      }
      
      // Provide specific recommendations
      const recommendations = this.getRecommendationsForTest(test);
      if (recommendations.length > 0) {
        console.log(`   💡 RECOMMENDATIONS:`);
        recommendations.forEach(rec => console.log(`      • ${rec}`));
      }
      console.log('');
    });

    // Statistics
    const avgBottom = bottomQuintile.reduce((sum, t) => sum + t.duration, 0) / bottomQuintile.length;
    const avgAll = sortedTests.reduce((sum, t) => sum + t.duration, 0) / sortedTests.length;
    
    console.log(`📊 QUINTILE STATISTICS:`);
    console.log(`   Bottom quintile average: ${avgBottom.toFixed(1)}ms`);
    console.log(`   Overall average: ${avgAll.toFixed(1)}ms`);
    console.log(`   Performance ratio: ${(avgBottom / avgAll).toFixed(1)}x slower than average\n`);
  }

  private getRecommendationsForTest(test: IndividualTestTiming): string[] {
    const recommendations: string[] = [];
    
    // Category-specific recommendations
    if (test.category === 'Fast Tests' && test.duration > 50) {
      recommendations.push('Consider mocking external dependencies with MSW');
      recommendations.push('Check for synchronous operations that could be optimized');
      recommendations.push('Ensure no real HTTP calls or database connections');
    }
    
    if (test.category === 'Unit Tests' && test.duration > 100) {
      recommendations.push('Move to integration tests if using real infrastructure');
      recommendations.push('Use dependency injection for better isolation');
      recommendations.push('Consider test.concurrent for independent async tests');
    }
    
    // Universal recommendations for slow tests
    if (test.duration > this.slowTestThreshold) {
      recommendations.push('Profile with Node.js --cpu-prof flag');
      recommendations.push('Check for unnecessary file transforms with DEBUG=vite-node:*');
      recommendations.push('Consider disabling isolation with test.isolate: false');
    }
    
    // File-specific recommendations
    if (test.file.includes('.fast.') && test.duration > 10) {
      recommendations.push('Fast test should target <10ms - review implementation');
    }
    
    if (test.file.includes('integration') && test.duration > 500) {
      recommendations.push('Integration test exceeding 500ms - consider test containers');
    }
    
    return recommendations;
  }

  private reportVitestMetrics(): void {
    console.log('⚡ VITEST PERFORMANCE METRICS\n');
    
    const sortedTests = [...this.individualTests].sort((a, b) => b.duration - a.duration);
    const slowTests = sortedTests.filter(t => t.duration > this.slowTestThreshold);
    
    console.log(`📈 Total tests analyzed: ${this.individualTests.length}`);
    console.log(`🐌 Tests exceeding threshold (${this.slowTestThreshold}ms): ${slowTests.length}`);
    console.log(`⚡ Fastest test: ${sortedTests[sortedTests.length - 1]?.duration || 0}ms`);
    console.log(`🐌 Slowest test: ${sortedTests[0]?.duration || 0}ms`);
    
    if (slowTests.length > 0) {
      console.log('\n🚨 TESTS EXCEEDING SLOW THRESHOLD:');
      slowTests.slice(0, 10).forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.name} (${test.duration}ms) - ${test.file}`);
      });
      
      if (slowTests.length > 10) {
        console.log(`   ... and ${slowTests.length - 10} more`);
      }
    }
    
    // Performance distribution
    const buckets = {
      veryFast: sortedTests.filter(t => t.duration <= 10).length,
      fast: sortedTests.filter(t => t.duration > 10 && t.duration <= 50).length,
      medium: sortedTests.filter(t => t.duration > 50 && t.duration <= this.slowTestThreshold).length,
      slow: slowTests.length
    };
    
    console.log('\n📊 PERFORMANCE DISTRIBUTION:');
    console.log(`   ⚡ Very Fast (≤10ms): ${buckets.veryFast} tests (${(buckets.veryFast / this.individualTests.length * 100).toFixed(1)}%)`);
    console.log(`   🟢 Fast (11-50ms): ${buckets.fast} tests (${(buckets.fast / this.individualTests.length * 100).toFixed(1)}%)`);
    console.log(`   🟡 Medium (51-${this.slowTestThreshold}ms): ${buckets.medium} tests (${(buckets.medium / this.individualTests.length * 100).toFixed(1)}%)`);
    console.log(`   🔴 Slow (>${this.slowTestThreshold}ms): ${buckets.slow} tests (${(buckets.slow / this.individualTests.length * 100).toFixed(1)}%)`);
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
      // For npm scripts, check if they exist in package.json
      if (command.startsWith('npm run ')) {
        const scriptName = command.replace('npm run ', '');
        const packageJsonPath = join(process.cwd(), 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
          return !!(packageJson.scripts && packageJson.scripts[scriptName]);
        }
      }
      
      // For other commands, try running with --help
      execSync(`${command} --help`, { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private generateEnhancedReport(): void {
    console.log('📊 ENHANCED TEST SPEED ANALYSIS REPORT\n');
    console.log('=' .repeat(80));
    
    // Show Vitest-specific metrics if available
    if (this.individualTests.length > 0) {
      this.reportVitestMetrics();
      console.log('');
    }

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

  private generateTechniqueReport(): void {
    console.log('📊 TECHNIQUE PERFORMANCE CULPRIT REPORT\n');
    console.log('=' .repeat(80));
    
    // Show technique rankings if available
    if (this.individualTests.length > 0) {
      this.reportVitestMetrics();
      console.log('');
    }

    // Performance Summary focusing on techniques
    console.log('🏃 TECHNIQUE-FOCUSED PERFORMANCE SUMMARY\n');
    for (const result of this.results.filter(r => r.duration > 0)) {
      const status = result.issues.length === 0 ? '✅' : '⚠️';
      console.log(`${status} ${result.category}: ${result.testCount} tests in ${result.duration}ms (${result.avgPerTest.toFixed(1)}ms avg)`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   🔴 ${issue}`));
      }
    }

    // Bottom quintile with technique focus
    if (this.individualTests.length > 0) {
      const sortedTests = [...this.individualTests].sort((a, b) => b.duration - a.duration);
      const quintileSize = Math.ceil(sortedTests.length / 5);
      const bottomQuintile = sortedTests.slice(0, quintileSize);
      
      console.log('\n🐌 SLOWEST TECHNIQUES (Bottom Quintile)\n');
      
      bottomQuintile.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}`);
        console.log(`   Duration: ${test.duration}ms | Category: ${test.category}`);
        if (test.issues.length > 0) {
          console.log(`   Issues: ${test.issues.slice(0, 2).join(', ')}`);
        }
      });
    }

    // Infrastructure summary
    const totalOrphanedTests = this.skippedCategories.reduce((sum, cat) => 
      cat.status === 'unavailable' ? sum + cat.testCount : sum, 0);
    
    if (totalOrphanedTests > 0) {
      console.log(`\n🏗️  INFRASTRUCTURE CULPRITS: ${totalOrphanedTests} orphaned tests need containers/infrastructure`);
      console.log('   💡 Major performance gain available by converting to MSW mocking');
    }

    // Recommendations focused on technique optimization
    console.log('\n💡 TECHNIQUE OPTIMIZATION RECOMMENDATIONS\n');
    
    const slowTests = this.slowTests.filter(t => t.severity === 'error');
    if (slowTests.length > 0) {
      console.log('🔴 IMMEDIATE ACTIONS - Critical Performance Issues:');
      slowTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.duration}ms (limit: ${test.limit}ms)`);
      });
      console.log('   💡 Focus on: MSW mocking, test isolation, and removing infrastructure dependencies\n');
    }

    const classificationIssues = this.results.filter(r => r.issues.length > 0 && r.duration === 0);
    if (classificationIssues.length > 0) {
      console.log('🏷️  TECHNIQUE CLASSIFICATION FIXES:');
      console.log('   1. Move testcontainer/docker tests → tests/integration/');
      console.log('   2. Add MSW mocking → tests/unit/ with .fast. suffix');
      console.log('   3. Add performance validation → expectFastExecution()');
      console.log('   4. Use configurable data → TEMPORAL_CONFIG pattern\n');
    }

    // Success criteria
    const fastTestsGood = this.results.filter(r => r.category.includes('Fast')).every(r => r.issues.length === 0);
    const noSlowTests = this.slowTests.filter(t => t.severity === 'error').length === 0;
    
    console.log('=' .repeat(80));
    if (fastTestsGood && noSlowTests) {
      console.log('🎉 TECHNIQUE OPTIMIZATION: All tests use fast techniques!');
    } else {
      console.log('⚡ TECHNIQUE FOCUS NEEDED: Optimize slow testing techniques above.');
    }
    console.log('=' .repeat(80));
  }
}

// Run the enhanced analysis
const analyzer = new EnhancedTestSpeedAnalyzer();
analyzer.analyzeTestSpeeds().catch(console.error);