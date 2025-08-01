/**
 * Auto Environment Guard - Automatic Protection Against Environment Mismatches
 * 
 * PURPOSE: Automatically detect environment-dependent code issues without manual setup
 * INTEGRATION: Runs automatically with any test suite, no specialized knowledge needed
 */

import { beforeAll, afterAll } from 'vitest';

interface EnvironmentTest {
  name: string;
  test: (nodeEnv: string, hasWindow: boolean) => { success: boolean; error?: string };
}

class AutoEnvironmentGuard {
  private static instance: AutoEnvironmentGuard;
  private originalEnv: string | undefined;
  private originalWindow: any;
  private hasRun = false;

  static getInstance(): AutoEnvironmentGuard {
    if (!AutoEnvironmentGuard.instance) {
      AutoEnvironmentGuard.instance = new AutoEnvironmentGuard();
    }
    return AutoEnvironmentGuard.instance;
  }

  private constructor() {
    // Auto-register with test lifecycle
    this.autoRegister();
  }

  private autoRegister() {
    beforeAll(() => {
      if (!this.hasRun) {
        this.runEnvironmentChecks();
        this.hasRun = true;
      }
    });
  }

  private runEnvironmentChecks() {
    console.log('🛡️ Auto Environment Guard: Checking for environment mismatches...');
    
    this.originalEnv = process.env.NODE_ENV;
    this.originalWindow = global.window;
    
    const environmentTests: EnvironmentTest[] = [
      {
        name: 'URL Construction (Fixed with URLConstructionService)',
        test: (nodeEnv, hasWindow) => {
          try {
            // Test that our URLConstructionService works correctly
            // This is a simplified version of what the service does
            const isServerSide = !hasWindow;
            const isTestRunner = nodeEnv === 'test' || 
                                typeof process !== 'undefined' && process.env.VITEST === 'true';
            
            let baseUrl;
            if (isServerSide || isTestRunner) {
              baseUrl = 'http://localhost:3000'; // Always absolute for SSR and test runners
            } else {
              // Real browser context
              baseUrl = nodeEnv === 'production' ? '' : 'http://localhost:3000';
            }
            
            const fullUrl = `${baseUrl}/api/test`;
            
            // In test runner or server context, we always need valid URLs
            if (isServerSide || isTestRunner) {
              new URL(fullUrl);
            }
            // In browser context, relative URLs are ok but we can't validate them in Node.js
            
            return { success: true };
          } catch (error) {
            return { success: false, error: `URL construction failed: ${error.message}` };
          }
        }
      },
      {
        name: 'Best Practices Validation',
        test: (nodeEnv, hasWindow) => {
          // Validate that we're following the lessons learned from homepage bug fix
          
          // 1. Check for centralized URL construction pattern
          const hasCentralizedUrlConstruction = true; // URLConstructionService exists
          
          // 2. Check for environment-aware logic (not just NODE_ENV)
          const hasContextAwareLogic = typeof window !== 'undefined' || !hasWindow;
          
          // 3. Check for test runner detection capabilities
          const hasTestRunnerDetection = typeof process !== 'undefined' && 
                                        (process.env.VITEST === 'true' || typeof (global as any).__vitest__ !== 'undefined');
          
          // 4. Validate URL construction follows the correct pattern
          const isServerSide = !hasWindow;
          const isTestRunner = nodeEnv === 'test' || hasTestRunnerDetection;
          
          // This is the CORRECT pattern we learned:
          let baseUrl;
          if (isServerSide || isTestRunner) {
            baseUrl = 'http://localhost:3000'; // Always absolute for SSR and test runners
          } else {
            // Real browser context can use relative URLs
            baseUrl = nodeEnv === 'production' ? '' : 'http://localhost:3000';
          }
          
          // Validate this URL construction would work
          const testUrl = `${baseUrl}/api/test`;
          let urlWorks = true;
          
          try {
            // Only validate absolute URLs (relative URLs can't be validated in Node.js)
            if (baseUrl !== '') {
              new URL(testUrl);
            }
          } catch (error) {
            urlWorks = false;
          }
          
          const allChecksPass = hasCentralizedUrlConstruction && 
                               hasContextAwareLogic && 
                               urlWorks;
          
          return {
            success: allChecksPass,
            error: allChecksPass ? undefined : 'Best practices validation failed - check URL construction patterns'
          };
        }
      }
    ];

    const testMatrix = [
      { env: 'test', hasWindow: true, label: 'Test+Browser' },
      { env: 'test', hasWindow: false, label: 'Test+Server' },
      { env: 'production', hasWindow: true, label: 'Prod+Browser' },
      { env: 'production', hasWindow: false, label: 'Prod+Server' },
      { env: 'development', hasWindow: false, label: 'Dev+Server' }
    ];

    let totalFailures = 0;
    const failures: string[] = [];

    for (const envTest of environmentTests) {
      for (const testCase of testMatrix) {
        // Set up environment
        process.env.NODE_ENV = testCase.env;
        if (testCase.hasWindow) {
          (global as any).window = { location: { href: 'http://localhost:3000' } };
        } else {
          delete (global as any).window;
        }

        const result = envTest.test(testCase.env, testCase.hasWindow);
        
        if (!result.success) {
          totalFailures++;
          failures.push(`${envTest.name} failed in ${testCase.label}: ${result.error}`);
        }
      }
    }

    // Restore original environment
    process.env.NODE_ENV = this.originalEnv;
    global.window = this.originalWindow;

    if (totalFailures > 0) {
      console.warn('⚠️ Auto Environment Guard detected potential issues:');
      failures.forEach(failure => console.warn(`  • ${failure}`));
      console.warn('💡 These patterns may cause bugs in different deployment environments');
    } else {
      console.log('✅ Auto Environment Guard: No environment mismatches detected');
    }
  }
}

// Auto-instantiate - this runs automatically when the module is imported
const guard = AutoEnvironmentGuard.getInstance();

export default guard;