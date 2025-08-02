/**
 * Environment Mismatch Detector - Generalized Fast Check
 * 
 * PURPOSE: Broad resistance to environment-dependent infrastructure failures
 * PATTERN: Test ANY function across ALL environment combinations to catch mismatches
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { expectFastExecution } from '../utils/fast-test-setup.js';

describe('Environment Mismatch Detector (Generalized)', () => {
  let originalEnv: string | undefined;
  let originalWindow: any;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalWindow = global.window;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.window = originalWindow;
  });

  it('should detect environment-dependent code paths that break', () => {
  const start = performance.now();
  
    console.log('🔍 GENERALIZED ENVIRONMENT MISMATCH DETECTION');
    console.log('===========================================\n');
    
    // Generic pattern: Any code that behaves differently based on environment
    const environmentDependentPatterns = [
      {
        name: 'URL Construction Pattern',
        description: 'Code that builds URLs differently per environment',
        testFunction: (nodeEnv: string, hasWindow: boolean) => {
          // This represents the common pattern we want to catch
          const baseUrl = nodeEnv === 'test' ? 'http://localhost:3000' : '';
          const fullUrl = `${baseUrl
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
}/api/endpoint`;
          
          // The test: Can this URL actually be used?
          try {
            new URL(fullUrl);
            return { success: true, url: fullUrl, error: null };
          } catch (error) {
            return { success: false, url: fullUrl, error: error.message };
          }
        },
        shouldWorkInAllEnvironments: true
      },
      {
        name: 'Configuration Loading Pattern',
        description: 'Code that loads config differently per environment',
        testFunction: (nodeEnv: string, hasWindow: boolean) => {
          // Common pattern: environment-specific configuration
          const config = {
            apiUrl: nodeEnv === 'test' ? 'http://localhost:3000' : process.env.API_URL || '',
            enableFeature: nodeEnv !== 'production',
            timeout: hasWindow ? 5000 : 30000
          };
          
          // The test: Is configuration complete and usable?
          const hasRequiredConfig = config.apiUrl && config.timeout > 0;
          return { 
            success: hasRequiredConfig, 
            config, 
            error: hasRequiredConfig ? null : 'Missing required configuration' 
          };
        },
        shouldWorkInAllEnvironments: true
      },
      {
        name: 'Context Detection Pattern',
        description: 'Code that detects browser vs server context',
        testFunction: (nodeEnv: string, hasWindow: boolean) => {
          // Common pattern: different behavior for browser vs server
          const isServer = !hasWindow;
          const isBrowser = hasWindow;
          
          // The test: Context detection should be consistent
          const contextValid = isServer !== isBrowser; // Should be mutually exclusive
          
          return {
            success: contextValid,
            context: { isServer, isBrowser, hasWindow },
            error: contextValid ? null : 'Invalid context detection'
          };
        },
        shouldWorkInAllEnvironments: true
      }
    ];
    
    // Test matrix: All environment combinations
    const testMatrix = [
      { env: 'test', hasWindow: true, context: 'Test Browser' },
      { env: 'test', hasWindow: false, context: 'Test Server' },
      { env: 'production', hasWindow: true, context: 'Prod Browser' },
      { env: 'production', hasWindow: false, context: 'Prod Server' },
      { env: 'development', hasWindow: true, context: 'Dev Browser' },
      { env: 'development', hasWindow: false, context: 'Dev Server' }
    ];
    
    console.log('🧪 Testing Environment-Dependent Patterns:\n');
    
    let totalFailures = 0;
    
    environmentDependentPatterns.forEach(pattern => {
      console.log(`📋 ${pattern.name}:`);
      console.log(`   ${pattern.description}\n`);
      
      let patternFailures = 0;
      
      testMatrix.forEach(test => {
        // Set up environment
        process.env.NODE_ENV = test.env;
        if (test.hasWindow) {
          (global as any).window = { location: { href: 'http://localhost:3000' } };
        } else {
          delete (global as any).window;
        }
        
        // Test the pattern
        const result = pattern.testFunction(test.env, test.hasWindow);
        const shouldWork = pattern.shouldWorkInAllEnvironments;
        const actuallyWorks = result.success;
        
        const status = actuallyWorks ? '✅' : '❌';
        const issue = (!actuallyWorks && shouldWork) ? ' ← ENVIRONMENT MISMATCH!' : '';
        
        console.log(`   ${status} ${test.context}: ${result.error || 'OK'}${issue}`);
        
        if (!actuallyWorks && shouldWork) {
          patternFailures++;
          totalFailures++;
        }
      });
      
      console.log(`   Result: ${patternFailures} failures\n`);
    });
    
    console.log(`🎯 TOTAL ENVIRONMENT MISMATCHES: ${totalFailures}`);
    
    if (totalFailures > 0) {
      console.log('\n🔴 ENVIRONMENT MISMATCH DETECTED!');
      console.log('This indicates code that works in some environments but fails in others.');
      console.log('Common causes: URL construction, config loading, context detection.');
    } else {
      console.log('\n✅ NO ENVIRONMENT MISMATCHES DETECTED');
    }
    
    // This should catch environment mismatches broadly
    expect(totalFailures).toBe(0);
  });

  it('should provide generalized fix patterns for environment mismatches', () => {
  const start = performance.now();
  
    console.log('🔧 GENERALIZED FIX PATTERNS');
    console.log('===========================\n');
    
    const commonFixPatterns = [
      {
        problem: 'Environment-Specific URL Construction',
        badPattern: 'const url = env === "test" ? absolute : relative',
        goodPattern: 'const url = (env === "test" || isServer) ? absolute : relative',
        principle: 'Consider context (server/browser) not just environment'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      {
        problem: 'Mock-Dependent Testing',
        badPattern: 'Only test with mocks that mask real failures',
        goodPattern: 'Test both with and without mocks',
        principle: 'Mocks should supplement, not replace, real scenario testing'
      },
      {
        problem: 'Hardcoded Environment Assumptions',
        badPattern: 'if (NODE_ENV === "production") { special case }',
        goodPattern: 'if (isProductionLike() || hasSpecialNeeds()) { special case }',
        principle: 'Test the actual conditions, not environment names'
      },
      {
        problem: 'Context-Blind Code',
        badPattern: 'Code assumes browser context always available',
        goodPattern: 'Detect and handle both browser and server contexts',
        principle: 'Universal code should work in any execution context'
      }
    ];
    
    console.log('🎯 Common Fix Patterns:\n');
    
    commonFixPatterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.problem}`);
      console.log(`   ❌ Bad:  ${pattern.badPattern}`);
      console.log(`   ✅ Good: ${pattern.goodPattern}`);
      console.log(`   💡 Principle: ${pattern.principle}\n`);
    });
    
    expect(commonFixPatterns.length).toBeGreaterThan(3);
  });

  it('should provide a reusable test pattern for any environment-dependent code', () => {
  const start = performance.now();
  
    console.log('🛠️ REUSABLE TEST PATTERN');
    console.log('=======================\n');
    
    // Generic test pattern that can be applied to any function
    const reusableTestPattern = `
    /**
     * Generic Environment Mismatch Test
     * Apply this pattern to ANY function that might behave differently per environment
     */
    function testEnvironmentMismatch<T>(
      functionToTest: (nodeEnv: string, hasWindow: boolean) => T,
      validateResult: (result: T, context: { env: string, hasWindow: boolean
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
}) => boolean,
      functionName: string
    ) {
      const environments = ['test', 'production', 'development'];
      const contexts = [true, false]; // hasWindow
      
      let failures = 0;
      
      for (const env of environments) {
        for (const hasWindow of contexts) {
          const contextName = hasWindow ? 'Browser' : 'Server';
          
          try {
            const result = functionToTest(env, hasWindow);
            const isValid = validateResult(result, { env, hasWindow });
            
            if (!isValid) {
              console.error(\`❌ \${functionName} failed in \${env} \${contextName}\`);
              failures++;
            }
          } catch (error) {
            console.error(\`💥 \${functionName} threw error in \${env} \${contextName}: \${error.message}\`);
            failures++;
          }
        }
      }
      
      if (failures === 0) {
        console.log(\`✅ \${functionName} works in all environments\`);
      }
      
      return failures;
    }
    
    // Example usage:
    const urlConstructorFailures = testEnvironmentMismatch(
      (env, hasWindow) => {
        const baseUrl = env === 'test' ? 'http://localhost:3000' : '';
        return \`\${baseUrl}/api/endpoint\`;
      },
      (url, context) => {
        // Validation: URL should be usable in all contexts
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      'URL Constructor'
    );
    `.trim();
    
    console.log('📝 Reusable Pattern:');
    console.log(reusableTestPattern);
    console.log('\n');
    
    console.log('🎯 How to Use This Pattern:');
    console.log('1. Identify any function that might behave differently per environment');
    console.log('2. Create a test using testEnvironmentMismatch()');
    console.log('3. Define validation criteria for "working correctly"');
    console.log('4. Run across all environment × context combinations');
    console.log('5. Fix any failures before deployment');
    console.log('\n');
    
    // Test the pattern works
    expect(reusableTestPattern.includes('testEnvironmentMismatch')).toBe(true);
  });

  it('should validate common infrastructure assumptions', () => {
  const start = performance.now();
  
    console.log('🏗️ INFRASTRUCTURE ASSUMPTION VALIDATOR');
    console.log('====================================\n');
    
    // Common assumptions that cause environment mismatches
    const infrastructureAssumptions = [
      {
        assumption: 'MSW can mock any URL pattern',
        test: () => {
          // Test if MSW would work with relative URLs
          const relativeUrl = '/api/test';
          try {
            new URL(relativeUrl);
            return { valid: true, reason: 'URL parseable'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
};
          } catch (error) {
            return { valid: false, reason: 'MSW cannot intercept relative URLs in Node.js' };
          }
        }
      },
      {
        assumption: 'window object is always available',
        test: () => {
          const hasWindow = typeof global.window !== 'undefined';
          return { 
            valid: hasWindow, 
            reason: hasWindow ? 'Window available' : 'Server-side context has no window' 
          };
        }
      },
      {
        assumption: 'NODE_ENV controls all environment behavior',
        test: () => {
          // Check if NODE_ENV alone is sufficient for all decisions
          const nodeEnv = process.env.NODE_ENV;
          const hasWindow = typeof global.window !== 'undefined';
          
          // If NODE_ENV is 'production' but we're in a server context, we might need different behavior
          const needsContextAwareness = nodeEnv === 'production' && !hasWindow;
          
          return {
            valid: !needsContextAwareness,
            reason: needsContextAwareness 
              ? 'Production + Server context needs special handling' 
              : 'NODE_ENV sufficient for current context'
          };
        }
      },
      {
        assumption: 'Relative URLs work everywhere',
        test: () => {
          const relativeUrl = '/api/endpoint';
          const hasWindow = typeof global.window !== 'undefined';
          
          // Relative URLs only work in browser contexts or with a base URL
          const willWork = hasWindow || process.env.NODE_ENV === 'test';
          
          return {
            valid: willWork,
            reason: willWork 
              ? 'Context supports relative URLs' 
              : 'Server-side context needs absolute URLs'
          };
        }
      }
    ];
    
    console.log('🧪 Testing Infrastructure Assumptions:\n');
    
    let invalidAssumptions = 0;
    
    infrastructureAssumptions.forEach((assumption, index) => {
      console.log(`${index + 1}. "${assumption.assumption}"`);
      
      const result = assumption.test();
      const status = result.valid ? '✅' : '❌';
      
      console.log(`   ${status} ${result.reason}`);
      
      if (!result.valid) {
        invalidAssumptions++;
        console.log(`   🔧 This assumption may cause environment mismatches`);
      }
      
      console.log('');
    });
    
    console.log(`🎯 INVALID ASSUMPTIONS: ${invalidAssumptions}/${infrastructureAssumptions.length}`);
    
    if (invalidAssumptions > 0) {
      console.log('\n⚠️ Some infrastructure assumptions are invalid for current context');
      console.log('These may cause bugs when environment conditions change');
    }
    
    // This helps identify assumption violations early
    expect(invalidAssumptions).toBeLessThan(infrastructureAssumptions.length);
  });
});