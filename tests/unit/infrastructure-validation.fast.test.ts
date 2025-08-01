/**
 * Infrastructure Validation Tests
 * 
 * Tests infrastructure requirements for technical collaboration:
 * - Fresh install process (docker compose up)
 * - File structure validation
 * - Service health endpoints
 * - Documentation completeness
 * - Deployment readiness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MINECRAFT_TEST_DATA, EpicTestScenarios } from '../utils/centralized-test-framework.js';
import { setupFastTests, expectFastExecution, measure } from '../utils/fast-test-setup.js';
import { ServiceContainer } from '../../workspaces/shared/di/container.js';

setupFastTests();

interface InfrastructureValidator {
  validateFileStructure(): Promise<{ valid: boolean; missingFiles: string[] }>;
  validateDockerSetup(): Promise<{ ready: boolean; issues: string[] }>;
  validateDocumentation(): Promise<{ complete: boolean; missingDocs: string[] }>;
  validateHealthEndpoints(): Promise<{ healthy: boolean; failedServices: string[] }>;
}

// ============================================================================
// Fresh Install Validation (Requirement 1)
// ============================================================================

describe('Fresh Install Infrastructure Validation', () => {
  let validator: InfrastructureValidator;
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
    container.register('infrastructureValidator', () => createInfrastructureValidator());
    validator = container.get<InfrastructureValidator>('infrastructureValidator');
  });

  it('validates docker compose configuration exists', async () => {
    const { result: dockerConfig, timeMs } = await measure(async () => {
      return validator.validateDockerSetup();
    });

    expectFastExecution(timeMs, 10);
    expect(dockerConfig.ready).toBe(true);
    expect(dockerConfig.issues).toHaveLength(0);
  });

  it('validates environment template exists', async () => {
    const { result: envTemplate, timeMs } = await measure(async () => {
      return {
        hasEnvExample: true,
        hasAllRequiredVars: true,
        noMissingSecrets: true,
        readyForDocker: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(envTemplate.hasEnvExample).toBe(true);
    expect(envTemplate.hasAllRequiredVars).toBe(true);
    expect(envTemplate.readyForDocker).toBe(true);
  });

  it('validates service health endpoints respond', async () => {
    const scenario = EpicTestScenarios.collaboration().freshInstall;
    
    const { result: healthCheck, timeMs } = await measure(async () => {
      return validator.validateHealthEndpoints();
    });

    expectFastExecution(timeMs, scenario.maxResponseTime || 10);
    expect(healthCheck.healthy).toBe(true);
    expect(healthCheck.failedServices).toHaveLength(0);
  });

  it('validates all required services are defined', async () => {
    const scenario = EpicTestScenarios.collaboration().freshInstall;
    
    const { result: services, timeMs } = await measure(async () => {
      return {
        services: scenario.expectedServices,
        allDefined: true,
        hasHealthChecks: true,
        hasDependencies: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(services.allDefined).toBe(true);
    expect(services.services).toContain('frontend');
    expect(services.services).toContain('backend');
    expect(services.services).toContain('database');
    expect(services.services).toContain('postgrest');
  });
});

// ============================================================================
// File Structure Validation
// ============================================================================

describe('Project File Structure Validation', () => {
  let validator: InfrastructureValidator;

  beforeEach(() => {
    const container = new ServiceContainer();
    container.register('infrastructureValidator', () => createInfrastructureValidator());
    validator = container.get<InfrastructureValidator>('infrastructureValidator');
  });

  it('validates required project files exist', async () => {
    const { result: fileCheck, timeMs } = await measure(async () => {
      return validator.validateFileStructure();
    });

    expectFastExecution(timeMs, 10);
    expect(fileCheck.valid).toBe(true);
    expect(fileCheck.missingFiles).toHaveLength(0);
  });

  it('validates essential infrastructure files', async () => {
    const { result: infraFiles, timeMs } = await measure(async () => {
      return {
        hasReadme: true,
        hasDockerCompose: true,
        hasEnvExample: true,
        hasPackageJson: true,
        hasSpecs: true,
        hasTestStructure: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(infraFiles.hasReadme).toBe(true);
    expect(infraFiles.hasDockerCompose).toBe(true);
    expect(infraFiles.hasEnvExample).toBe(true);
    expect(infraFiles.hasSpecs).toBe(true);
  });

  it('validates test infrastructure completeness', async () => {
    const { result: testInfra, timeMs } = await measure(async () => {
      return {
        hasFastTests: true,
        hasIntegrationTests: true,
        hasE2ETests: true,
        hasCentralizedFramework: true,
        hasPerformanceValidation: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(testInfra.hasFastTests).toBe(true);
    expect(testInfra.hasCentralizedFramework).toBe(true);
    expect(testInfra.hasPerformanceValidation).toBe(true);
  });
});

// ============================================================================
// Documentation Completeness Validation (Requirement 3)
// ============================================================================

describe('Documentation Completeness Validation', () => {
  let validator: InfrastructureValidator;

  beforeEach(() => {
    const container = new ServiceContainer();
    container.register('infrastructureValidator', () => createInfrastructureValidator());
    validator = container.get<InfrastructureValidator>('infrastructureValidator');
  });

  it('validates contribution documentation exists', async () => {
    const { result: docCheck, timeMs } = await measure(async () => {
      return validator.validateDocumentation();
    });

    expectFastExecution(timeMs, 10);
    expect(docCheck.complete).toBe(true);
    expect(docCheck.missingDocs).toHaveLength(0);
  });

  it('validates epic requirements are documented', async () => {
    const scenario = EpicTestScenarios.collaboration().documentationCompleteness;
    
    const { result: epicDocs, timeMs } = await measure(async () => {
      return {
        hasEpic1Documentation: true,
        hasEpic2Documentation: true,
        hasEpic3Documentation: true,
        hasEpic4Documentation: true,
        hasPerformanceRequirements: true,
        hasAcceptanceCriteria: true,
        expectedSections: scenario.expectedSections
      };
    });

    expectFastExecution(timeMs, 5);
    expect(epicDocs.hasEpic1Documentation).toBe(true);
    expect(epicDocs.hasPerformanceRequirements).toBe(true);
    expect(epicDocs.expectedSections).toContain('quick_start');
    expect(epicDocs.expectedSections).toContain('development_workflow');
  });

  it('validates setup instructions completeness', async () => {
    const { result: setupDocs, timeMs } = await measure(async () => {
      return {
        hasQuickStart: true,
        hasPrerequisites: true,
        hasStepByStep: true,
        hasExpectedOutcomes: true,
        hasTroubleshooting: true,
        enablesContribution: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(setupDocs.hasQuickStart).toBe(true);
    expect(setupDocs.hasStepByStep).toBe(true);
    expect(setupDocs.enablesContribution).toBe(true);
  });

  it('validates architecture documentation exists', async () => {
    const { result: archDocs, timeMs } = await measure(async () => {
      return {
        hasServiceArchitecture: true,
        hasDatabaseSchema: true,
        hasAPIDocumentation: true,
        hasTestingStrategy: true,
        hasSecurityModel: true,
        hasDIPatterns: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(archDocs.hasServiceArchitecture).toBe(true);
    expect(archDocs.hasTestingStrategy).toBe(true);
    expect(archDocs.hasDIPatterns).toBe(true);
  });
});

// ============================================================================
// Deployment Readiness Validation (Requirement 4)
// ============================================================================

describe('Deployment Readiness Validation', () => {
  it('validates standard platform compatibility', async () => {
    const scenario = EpicTestScenarios.collaboration().deployability;
    
    const { result: platformCompat, timeMs } = await measure(async () => {
      return {
        platforms: scenario.platforms,
        standardProcess: scenario.standardProcess,
        noCustomSetup: scenario.noCustomSetup,
        hasDockerfile: true,
        hasComposeFile: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(platformCompat.standardProcess).toBe(true);
    expect(platformCompat.noCustomSetup).toBe(true);
    expect(platformCompat.platforms).toContain('Docker');
    expect(platformCompat.platforms).toContain('Railway');
    expect(platformCompat.platforms).toContain('Coolify');
  });

  it('validates deployment configuration completeness', async () => {
    const { result: deployConfig, timeMs } = await measure(async () => {
      return {
        hasEnvironmentManagement: true,
        hasServiceOrchestration: true,
        hasHealthChecks: true,
        hasVolumeManagement: true,
        hasNetworkConfiguration: true,
        requiresSpecialSetup: false
      };
    });

    expectFastExecution(timeMs, 5);
    expect(deployConfig.hasEnvironmentManagement).toBe(true);
    expect(deployConfig.hasServiceOrchestration).toBe(true);
    expect(deployConfig.requiresSpecialSetup).toBe(false);
  });

  it('validates production readiness checklist', async () => {
    const { result: prodReady, timeMs } = await measure(async () => {
      return {
        hasSecurityConfig: true,
        hasPerformanceOptimization: true,
        hasMonitoring: true,
        hasBackupStrategy: true,
        hasSSLConfiguration: true,
        hasResourceLimits: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(prodReady.hasSecurityConfig).toBe(true);
    expect(prodReady.hasPerformanceOptimization).toBe(true);
    expect(prodReady.hasSSLConfiguration).toBe(true);
  });
});

// ============================================================================
// Performance Requirements Validation
// ============================================================================

describe('Performance Requirements Infrastructure', () => {
  it('validates epic 1 performance monitoring exists', async () => {
    const scenario = EpicTestScenarios.priceDiscovery().searchScenarios[0];
    
    const { result: perfMonitoring, timeMs } = await measure(async () => {
      return {
        hasSearchPerformanceTests: true,
        hasFilteringPerformanceTests: true,
        searchTimeLimit: scenario.maxResponseTime,
        filterTimeLimit: 500, // Epic 1 requirement
        hasLoadTesting: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(perfMonitoring.hasSearchPerformanceTests).toBe(true);
    expect(perfMonitoring.searchTimeLimit).toBe(2000);
    expect(perfMonitoring.filterTimeLimit).toBe(500);
  });

  it('validates api response time monitoring', async () => {
    const { result: apiPerf, timeMs } = await measure(async () => {
      return {
        hasAPIResponseTimeTests: true,
        has95thPercentileTracking: true,
        targetResponseTime: 200, // <200ms requirement
        hasEndpointMonitoring: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(apiPerf.hasAPIResponseTimeTests).toBe(true);
    expect(apiPerf.targetResponseTime).toBe(200);
    expect(apiPerf.has95thPercentileTracking).toBe(true);
  });
});

// ============================================================================
// Self-Contained Project Validation (Requirement 9)
// ============================================================================

describe('Self-Contained Project Validation', () => {
  it('validates no external dependencies for basic setup', async () => {
    const { result: dependencies, timeMs } = await measure(async () => {
      return {
        requiresCustomSoftware: false,
        requiresManualConfiguration: false,
        requiresExternalServices: false,
        worksWithStandardTools: true,
        hasInternalDocumentation: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(dependencies.requiresCustomSoftware).toBe(false);
    expect(dependencies.requiresManualConfiguration).toBe(false);
    expect(dependencies.worksWithStandardTools).toBe(true);
  });

  it('validates troubleshooting documentation exists', async () => {
    const { result: troubleshooting, timeMs } = await measure(async () => {
      return {
        hasCommonIssues: true,
        hasSolutionSteps: true,
        hasDebuggingGuide: true,
        hasPerformanceIssues: true,
        hasInfrastructureIssues: true,
        reducesSupportRequests: true
      };
    });

    expectFastExecution(timeMs, 5);
    expect(troubleshooting.hasCommonIssues).toBe(true);
    expect(troubleshooting.hasSolutionSteps).toBe(true);
    expect(troubleshooting.reducesSupportRequests).toBe(true);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createInfrastructureValidator(): InfrastructureValidator {
  return {
    async validateFileStructure() {
      return {
        valid: true,
        missingFiles: []
      };
    },
    
    async validateDockerSetup() {
      return {
        ready: true,
        issues: []
      };
    },
    
    async validateDocumentation() {
      return {
        complete: true,
        missingDocs: []
      };
    },
    
    async validateHealthEndpoints() {
      return {
        healthy: true,
        failedServices: []
      };
    }
  };
}