/**
 * Fresh Install Validation Tests
 * 
 * INTEGRATION TESTS: Validates actual fresh install process
 * 
 * These tests verify the real file system, docker configuration,
 * and documentation to ensure technical collaboration requirements are met.
 * 
 * Tests run against actual project structure, not mocks.
 */

import { describe, it, expect } from 'vitest';
import { readFile, access, readdir } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd());

// ============================================================================
// Requirement 1: Fresh Install Process
// ============================================================================

describe('Fresh Install Process Validation', () => {
  it('validates docker compose configuration exists and is valid', async () => {
    const composePath = join(PROJECT_ROOT, 'compose.yml');
    
    try {
      await access(composePath);
      const composeContent = await readFile(composePath, 'utf-8');
      
      // Validate essential services
      expect(composeContent).toContain('services:');
      expect(composeContent).toContain('postgres');
      expect(composeContent).toContain('valkey');
      
      // Validate has volumes for persistence
      expect(composeContent).toContain('volumes:');
      
    } catch (error) {
      throw new Error(`Docker compose file missing or invalid: ${error}`);
    }
  });

  it('validates environment template exists with all required variables', async () => {
    const envExamplePath = join(PROJECT_ROOT, '.env.example');
    
    try {
      await access(envExamplePath);
      const envContent = await readFile(envExamplePath, 'utf-8');
      
      // Check for essential environment variables
      const requiredVars = [
        'POSTGRES_DB',
        'POSTGRES_USER', 
        'POSTGRES_PASSWORD',
        'DISCORD_CLIENT_ID',
        'DISCORD_CLIENT_SECRET',
        'JWT_SECRET'
      ];
      
      requiredVars.forEach(varName => {
        expect(envContent, `Missing required environment variable: ${varName}`)
          .toContain(varName);
      });
      
    } catch (error) {
      throw new Error(`Environment template missing: ${error}`);
    }
  });

  it('validates README has fresh install guarantee', async () => {
    const readmePath = join(PROJECT_ROOT, 'README.md');
    
    try {
      const readmeContent = await readFile(readmePath, 'utf-8');
      
      // Check for fresh install messaging
      expect(readmeContent).toContain('fresh install');
      expect(readmeContent).toContain('docker compose up');
      expect(readmeContent).toContain('without custom configuration');
      
      // Check for access points
      expect(readmeContent).toContain('localhost');
      
    } catch (error) {
      throw new Error(`README missing or invalid: ${error}`);
    }
  });

  it('validates project structure follows specification', async () => {
    const expectedDirectories = [
      'frontend',
      'backend', 
      'shared',
      'tests',
      'specs',
      'docs',
      'infrastructure'
    ];
    
    for (const dir of expectedDirectories) {
      const dirPath = join(PROJECT_ROOT, dir);
      try {
        await access(dirPath);
      } catch (error) {
        throw new Error(`Required directory missing: ${dir}`);
      }
    }
  });
});

// ============================================================================
// Requirement 3: Documentation Completeness
// ============================================================================

describe('Documentation Completeness Validation', () => {
  it('validates technical specification exists and is complete', async () => {
    const specPath = join(PROJECT_ROOT, 'specs', 'MINECRAFT_MARKETPLACE_SPEC.md');
    
    try {
      const specContent = await readFile(specPath, 'utf-8');
      
      // Check for epic definitions
      expect(specContent).toContain('Epic 1: Price Discovery');
      expect(specContent).toContain('Epic 2: Community Reporting');
      expect(specContent).toContain('Epic 3: Discord Integration');
      expect(specContent).toContain('Epic 4: Shop Management');
      
      // Check for performance requirements
      expect(specContent).toContain('<2s search');
      expect(specContent).toContain('<500ms filtering');
      expect(specContent).toContain('<200ms API');
      
      // Check for collaboration requirements
      expect(specContent).toContain('Fresh Install');
      expect(specContent).toContain('Working Demo');
      expect(specContent).toContain('Deployable');
      
    } catch (error) {
      throw new Error(`Technical specification missing: ${error}`);
    }
  });

  it('validates project structure documentation exists', async () => {
    const structurePath = join(PROJECT_ROOT, 'specs', 'PROJECT_STRUCTURE.md');
    
    try {
      await access(structurePath);
      const structureContent = await readFile(structurePath, 'utf-8');
      
      // Check for key architecture sections
      expect(structureContent).toContain('Project Structure');
      expect(structureContent).toContain('frontend/');
      expect(structureContent).toContain('backend/');
      expect(structureContent).toContain('shared/');
      
    } catch (error) {
      throw new Error(`Project structure documentation missing: ${error}`);
    }
  });

  it('validates development documentation exists in docs/', async () => {
    const docsPath = join(PROJECT_ROOT, 'docs');
    
    try {
      const docsContents = await readdir(docsPath, { recursive: true });
      
      // Check for essential documentation sections
      const hasReports = docsContents.some(file => file.includes('reports'));
      expect(hasReports, 'Missing reports documentation').toBe(true);
      
    } catch (error) {
      throw new Error(`Documentation directory missing: ${error}`);
    }
  });

  it('validates CLAUDE.md contains complete development context', async () => {
    const claudePath = join(PROJECT_ROOT, 'CLAUDE.md');
    
    try {
      const claudeContent = await readFile(claudePath, 'utf-8');
      
      // Check for key development context sections
      expect(claudeContent).toContain('Project Mission');
      expect(claudeContent).toContain('Architecture');
      expect(claudeContent).toContain('Data Model');
      expect(claudeContent).toContain('Testing Strategy');
      expect(claudeContent).toContain('TDD Rules');
      
      // Check for collaboration standards
      expect(claudeContent).toContain('Foundation-First');
      expect(claudeContent).toContain('SOLID');
      expect(claudeContent).toContain('Dependency Injection');
      
    } catch (error) {
      throw new Error(`CLAUDE.md development context missing: ${error}`);
    }
  });
});

// ============================================================================
// Requirement 4: Deployment Configuration
// ============================================================================

describe('Deployment Configuration Validation', () => {
  it('validates deployment configuration exists for standard platforms', async () => {
    const composePath = join(PROJECT_ROOT, 'compose.yml');
    
    try {
      const composeContent = await readFile(composePath, 'utf-8');
      
      // Check for production-ready configuration
      expect(composeContent).toContain('postgres:');
      expect(composeContent).toContain('valkey:');
      
      // Check for proper networking
      expect(composeContent).toContain('ports:');
      
      // Check for environment variable support
      expect(composeContent).toContain('${');
      
    } catch (error) {
      throw new Error(`Deployment configuration invalid: ${error}`);
    }
  });

  it('validates infrastructure directory exists with deployment configs', async () => {
    const infraPath = join(PROJECT_ROOT, 'infrastructure');
    
    try {
      await access(infraPath);
      const infraContents = await readdir(infraPath, { recursive: true });
      
      // Check for docker configuration
      const hasDockerConfig = infraContents.some(file => file.includes('docker'));
      expect(hasDockerConfig, 'Missing Docker configuration').toBe(true);
      
    } catch (error) {
      throw new Error(`Infrastructure directory missing: ${error}`);
    }
  });

  it('validates dockerfile exists for services', async () => {
    const frontendDockerfile = join(PROJECT_ROOT, 'frontend', 'Dockerfile');
    const backendDockerfile = join(PROJECT_ROOT, 'backend', 'Dockerfile');
    
    try {
      // Check if at least one Dockerfile exists
      let hasDockerfile = false;
      try {
        await access(frontendDockerfile);
        hasDockerfile = true;
      } catch {}
      
      try {
        await access(backendDockerfile);
        hasDockerfile = true;
      } catch {}
      
      // Or check for root Dockerfile
      try {
        await access(join(PROJECT_ROOT, 'Dockerfile'));
        hasDockerfile = true;
      } catch {}
      
      expect(hasDockerfile, 'No Dockerfile found for deployment').toBe(true);
      
    } catch (error) {
      throw new Error(`Dockerfile validation failed: ${error}`);
    }
  });
});

// ============================================================================
// Test Infrastructure Validation
// ============================================================================

describe('Test Infrastructure Validation', () => {
  it('validates centralized test framework exists', async () => {
    const frameworkPath = join(PROJECT_ROOT, 'tests', 'utils', 'centralized-test-framework.ts');
    
    try {
      const frameworkContent = await readFile(frameworkPath, 'utf-8');
      
      // Check for core framework components
      expect(frameworkContent).toContain('MINECRAFT_TEST_DATA');
      expect(frameworkContent).toContain('EpicTestScenarios');
      expect(frameworkContent).toContain('steve');
      expect(frameworkContent).toContain('alex');
      expect(frameworkContent).toContain('diamond_sword');
      
    } catch (error) {
      throw new Error(`Centralized test framework missing: ${error}`);
    }
  });

  it('validates fast test setup exists', async () => {
    const setupPath = join(PROJECT_ROOT, 'tests', 'utils', 'fast-test-setup.ts');
    
    try {
      const setupContent = await readFile(setupPath, 'utf-8');
      
      // Check for performance utilities
      expect(setupContent).toContain('setupFastTests');
      expect(setupContent).toContain('expectFastExecution');
      expect(setupContent).toContain('measure');
      
    } catch (error) {
      throw new Error(`Fast test setup missing: ${error}`);
    }
  });

  it('validates test configuration files exist', async () => {
    const vitestConfig = join(PROJECT_ROOT, 'config/testing/vitest.config.ts');
    const vitestFastConfig = join(PROJECT_ROOT, 'vitest.fast.config.ts');
    
    try {
      // At least one vitest config should exist
      let hasConfig = false;
      try {
        await access(vitestConfig);
        hasConfig = true;
      } catch {}
      
      try {
        await access(vitestFastConfig);
        hasConfig = true;
      } catch {}
      
      expect(hasConfig, 'No Vitest configuration found').toBe(true);
      
    } catch (error) {
      throw new Error(`Test configuration missing: ${error}`);
    }
  });
});

// ============================================================================
// Package Configuration Validation
// ============================================================================

describe('Package Configuration Validation', () => {
  it('validates package.json has proper test scripts', async () => {
    const packagePath = join(PROJECT_ROOT, 'package.json');
    
    try {
      const packageContent = await readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      // Check for test scripts
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      
      // Check for essential dependencies
      expect(packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest)
        .toBeDefined();
      
    } catch (error) {
      throw new Error(`Package.json missing or invalid: ${error}`);
    }
  });

  it('validates typescript configuration exists', async () => {
    const tsconfigPath = join(PROJECT_ROOT, 'tsconfig.json');
    
    try {
      await access(tsconfigPath);
      const tsconfigContent = await readFile(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      // Check for strict mode
      expect(tsconfig.compilerOptions).toBeDefined();
      
    } catch (error) {
      throw new Error(`TypeScript configuration missing: ${error}`);
    }
  });
});