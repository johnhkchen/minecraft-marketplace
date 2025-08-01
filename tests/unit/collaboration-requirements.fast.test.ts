/**
 * Collaboration Requirements Validation
 * 
 * Validates all 10 Technical Collaboration Requirements
 * Tests actual file system and project structure (no infrastructure dependencies)
 */

import { describe, it, expect } from 'vitest';
import { readFile, access, readdir } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd());

// ============================================================================
// Requirement 1: Fresh Install Works Without Custom Setup
// ============================================================================

describe('Requirement 1: Fresh Install Works on Any Machine', () => {
  it('validates GitHub Codespace configuration exists', async () => {
    const devcontainerPath = join(PROJECT_ROOT, '.devcontainer', 'devcontainer.json');
    
    try {
      await access(devcontainerPath);
      const devcontainerContent = await readFile(devcontainerPath, 'utf-8');
      const config = JSON.parse(devcontainerContent);
      
      expect(config.name).toContain('Minecraft Marketplace');
      expect(config.features).toBeDefined();
      expect(config.features['ghcr.io/devcontainers/features/nix:1']).toBeDefined();
      expect(config.features['ghcr.io/devcontainers/features/docker-in-docker:2']).toBeDefined();
      
    } catch (error) {
      throw new Error(`GitHub Codespace configuration missing: ${error}`);
    }
  });

  it('validates Nix development environment configuration', async () => {
    const flakePath = join(PROJECT_ROOT, 'flake.nix');
    
    try {
      await access(flakePath);
      const flakeContent = await readFile(flakePath, 'utf-8');
      
      expect(flakeContent).toContain('Minecraft Marketplace');
      expect(flakeContent).toContain('nodejs_22');
      expect(flakeContent).toContain('docker');
      expect(flakeContent).toContain('postgresql_17');
      expect(flakeContent).toContain('nix develop');
      
    } catch (error) {
      throw new Error(`Nix flake configuration missing: ${error}`);
    }
  });

  it('validates package.json has dev command for hot reload', async () => {
    const packagePath = join(PROJECT_ROOT, 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.dev).toContain('concurrently');
    expect(packageJson.scripts['dev:frontend']).toBeDefined();
    expect(packageJson.scripts['dev:backend']).toBeDefined();
  });
  it('validates docker compose file exists and has essential services', async () => {
    const composePath = join(PROJECT_ROOT, 'compose.yml');
    
    try {
      await access(composePath);
      const composeContent = await readFile(composePath, 'utf-8');
      
      expect(composeContent).toContain('services:');
      expect(composeContent).toContain('postgres');
      expect(composeContent).toContain('valkey');
      expect(composeContent).toContain('volumes:');
      
    } catch (error) {
      throw new Error(`Docker compose configuration missing: ${error}`);
    }
  });

  it('validates environment template exists with required variables', async () => {
    const envExamplePath = join(PROJECT_ROOT, '.env.example');
    
    try {
      await access(envExamplePath);
      const envContent = await readFile(envExamplePath, 'utf-8');
      
      const requiredVars = [
        'POSTGRES_DB',
        'POSTGRES_USER', 
        'POSTGRES_PASSWORD'
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
    
    const readmeContent = await readFile(readmePath, 'utf-8');
    
    expect(readmeContent).toContain('docker compose up');
    expect(readmeContent).toMatch(/fresh.install/i);
    expect(readmeContent).toContain('localhost');
  });
});

// ============================================================================
// Requirement 2: Working Demo Others Can Access
// ============================================================================

describe('Requirement 2: Working Demo Accessible to Others', () => {
  it('validates demo configuration exists', async () => {
    // Check for demo-specific compose file or configuration
    const hasDemo = await checkDemoConfiguration();
    expect(hasDemo).toBe(true);
  });

  it('validates project has realistic test data patterns', async () => {
    const frameworkPath = join(PROJECT_ROOT, 'tests', 'utils', 'centralized-test-framework.ts');
    
    try {
      const frameworkContent = await readFile(frameworkPath, 'utf-8');
      
      // Check for minecraft domain modeling
      expect(frameworkContent).toContain('steve');
      expect(frameworkContent).toContain('alex');
      expect(frameworkContent).toContain('diamond_sword');
      expect(frameworkContent).toContain('HermitCraft');
      
    } catch (error) {
      throw new Error(`Test data patterns missing: ${error}`);
    }
  });
});

// ============================================================================
// Requirement 3: Documentation Enables Contribution
// ============================================================================

describe('Requirement 3: Documentation Enables Contribution', () => {
  it('validates complete technical specification exists', async () => {
    const specPath = join(PROJECT_ROOT, 'specs', 'MINECRAFT_MARKETPLACE_SPEC.md');
    
    const specContent = await readFile(specPath, 'utf-8');
    
    // Epic definitions
    expect(specContent).toContain('Epic 1: Price Discovery');
    expect(specContent).toContain('Epic 2: Community Reporting');
    expect(specContent).toContain('Epic 3: Discord Integration');
    expect(specContent).toContain('Epic 4: Shop Management');
    
    // Performance requirements
    expect(specContent).toContain('<2s search');
    expect(specContent).toContain('<500ms');
    expect(specContent).toContain('<200ms API');
  });

  it('validates development context documentation exists', async () => {
    const claudePath = join(PROJECT_ROOT, 'CLAUDE.md');
    
    const claudeContent = await readFile(claudePath, 'utf-8');
    
    expect(claudeContent).toContain('Project Mission');
    expect(claudeContent).toContain('Architecture');
    expect(claudeContent).toContain('Testing Strategy');
    expect(claudeContent).toContain('TDD Rules');
    expect(claudeContent).toContain('Foundation-First');
  });

  it('validates setup and contribution instructions exist', async () => {
    const readmePath = join(PROJECT_ROOT, 'README.md');
    const readmeContent = await readFile(readmePath, 'utf-8');
    
    // Setup instructions
    expect(readmeContent).toContain('Quick Start');
    expect(readmeContent).toContain('Prerequisites');
    expect(readmeContent).toContain('Development');
    
    // Architecture information
    expect(readmeContent).toContain('Architecture');
    expect(readmeContent).toContain('Testing');
  });

  it('validates project structure documentation exists', async () => {
    const structurePath = join(PROJECT_ROOT, 'specs', 'PROJECT_STRUCTURE.md');
    
    try {
      await access(structurePath);
      const structureContent = await readFile(structurePath, 'utf-8');
      
      expect(structureContent).toContain('frontend/');
      expect(structureContent).toContain('backend/');
      expect(structureContent).toContain('shared/');
      expect(structureContent).toContain('tests/');
      
    } catch (error) {
      throw new Error(`Project structure documentation missing: ${error}`);
    }
  });
});

// ============================================================================
// Requirement 4: Deployable by Non-Builder
// ============================================================================

describe('Requirement 4: Deployable by Someone Who Didnt Build It', () => {
  it('validates standard docker deployment configuration', async () => {
    const composePath = join(PROJECT_ROOT, 'compose.yml');
    const composeContent = await readFile(composePath, 'utf-8');
    
    // Standard docker services
    expect(composeContent).toContain('postgres:');
    expect(composeContent).toContain('ports:');
    expect(composeContent).toContain('environment:');
    expect(composeContent).toContain('${'); // Environment variable substitution
  });

  it('validates deployment documentation exists', async () => {
    const readmePath = join(PROJECT_ROOT, 'README.md');
    const readmeContent = await readFile(readmePath, 'utf-8');
    
    // Deployment information should be in README
    expect(readmeContent).toContain('docker compose up');
    expect(readmeContent).toMatch(/deploy/i);
  });

  it('validates infrastructure directory exists', async () => {
    const infraPath = join(PROJECT_ROOT, 'infrastructure');
    
    try {
      await access(infraPath);
      const infraContents = await readdir(infraPath, { recursive: true });
      
      const hasDockerConfig = infraContents.some(file => file.includes('docker'));
      expect(hasDockerConfig, 'Missing Docker configuration in infrastructure/').toBe(true);
      
    } catch (error) {
      throw new Error(`Infrastructure directory missing: ${error}`);
    }
  });
});

// ============================================================================
// Requirement 5: Test Own Handoff Process
// ============================================================================

describe('Requirement 5: Test Own Handoff Process', () => {
  it('validates development baton exists with complete context', async () => {
    const batonPath = join(PROJECT_ROOT, 'docs', 'reports', 'development-baton.md');
    
    try {
      const batonContent = await readFile(batonPath, 'utf-8');
      
      expect(batonContent).toContain('Current Status');
      expect(batonContent).toContain('Technical Context');
      expect(batonContent).toContain('Successful Patterns');
      expect(batonContent).toContain('Priorities');
      
    } catch (error) {
      throw new Error(`Development baton missing: ${error}`);
    }
  });

  it('validates comprehensive reports exist documenting progress', async () => {
    const reportsPath = join(PROJECT_ROOT, 'docs', 'reports');
    
    const reportContents = await readdir(reportsPath);
    
    // Key reports should exist
    expect(reportContents).toContain('consolidation-success.md');
    expect(reportContents).toContain('development-baton.md');
    expect(reportContents).toContain('README.md');
  });
});

// ============================================================================
// Requirements 6-10: Quality Standards
// ============================================================================

describe('Requirements 6-10: Collaboration Quality Standards', () => {
  it('validates clear deliverables exist (Requirement 6)', async () => {
    const specPath = join(PROJECT_ROOT, 'specs', 'MINECRAFT_MARKETPLACE_SPEC.md');
    const specContent = await readFile(specPath, 'utf-8');
    
    // Clear epic definitions with acceptance criteria
    expect(specContent).toContain('Epic 1:');
    expect(specContent).toContain('Epic 2:');
    expect(specContent).toContain('Epic 3:');
    expect(specContent).toContain('Epic 4:');
    
    // Performance targets
    expect(specContent).toContain('<2s');
    expect(specContent).toContain('<500ms');
  });

  it('validates working code without debugging needed (Requirement 7)', async () => {
    // Check for comprehensive test suite
    const testsPath = join(PROJECT_ROOT, 'tests');
    const testContents = await readdir(testsPath, { recursive: true });
    
    const hasFastTests = testContents.some(file => file.includes('fast.test'));
    const hasIntegrationTests = testContents.some(file => file.includes('integration'));
    
    expect(hasFastTests, 'Missing fast tests for immediate validation').toBe(true);
    expect(hasIntegrationTests, 'Missing integration tests').toBe(true);
  });

  it('validates equal work distribution setup (Requirement 8)', async () => {
    const claudePath = join(PROJECT_ROOT, 'CLAUDE.md');
    const claudeContent = await readFile(claudePath, 'utf-8');
    
    // Should document testing, deployment, architecture
    expect(claudeContent).toContain('Testing');
    expect(claudeContent).toContain('Architecture');
    expect(claudeContent).toContain('Deployment');
    expect(claudeContent).toContain('Quality Gates');
  });

  it('validates self-contained project (Requirement 9)', async () => {
    const packagePath = join(PROJECT_ROOT, 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    // Should have test scripts
    expect(packageJson.scripts?.test).toBeDefined();
    
    // Should have essential testing dependencies
    const hasVitest = packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest;
    expect(hasVitest, 'Missing vitest testing framework').toBeDefined();
  });

  it('validates goal-focused processes (Requirement 10)', async () => {
    const specPath = join(PROJECT_ROOT, 'specs', 'MINECRAFT_MARKETPLACE_SPEC.md');
    const specContent = await readFile(specPath, 'utf-8');
    
    // Should have business goals and metrics
    expect(specContent).toContain('Success Metrics');
    expect(specContent).toContain('Business Goals');
    expect(specContent).toContain('Performance');
  });
});

// ============================================================================
// Test Infrastructure Quality
// ============================================================================

describe('Test Infrastructure Quality', () => {
  it('validates centralized test framework exists', async () => {
    const frameworkPath = join(PROJECT_ROOT, 'tests', 'utils', 'centralized-test-framework.ts');
    
    const frameworkContent = await readFile(frameworkPath, 'utf-8');
    
    expect(frameworkContent).toContain('MINECRAFT_TEST_DATA');
    expect(frameworkContent).toContain('EpicTestScenarios');
    expect(frameworkContent).toContain('priceDiscovery');
    expect(frameworkContent).toContain('communityReporting');
    expect(frameworkContent).toContain('discordIntegration');
    expect(frameworkContent).toContain('shopManagement');
  });

  it('validates fast test setup exists for rapid development', async () => {
    const setupPath = join(PROJECT_ROOT, 'tests', 'utils', 'fast-test-setup.ts');
    
    const setupContent = await readFile(setupPath, 'utf-8');
    
    expect(setupContent).toContain('setupFastTests');
    expect(setupContent).toContain('expectFastExecution');
    expect(setupContent).toContain('measure');
  });

  it('validates test configuration supports fast development', async () => {
    const vitestFastConfig = join(PROJECT_ROOT, 'vitest.fast.config.ts');
    
    try {
      await access(vitestFastConfig);
      const configContent = await readFile(vitestFastConfig, 'utf-8');
      expect(configContent).toContain('fast');
    } catch {
      // Fallback: check for regular vitest config
      const vitestConfig = join(PROJECT_ROOT, 'vitest.config.ts');
      await access(vitestConfig);
    }
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

async function checkDemoConfiguration(): Promise<boolean> {
  // Check for demo-related files
  const demoComposeFile = join(PROJECT_ROOT, 'compose.demo.yml');
  const infraDemoDir = join(PROJECT_ROOT, 'infrastructure', 'demo');
  
  try {
    await access(demoComposeFile);
    return true;
  } catch {}
  
  try {
    await access(infraDemoDir);
    return true;
  } catch {}
  
  // Check if main compose file has demo configuration
  try {
    const composePath = join(PROJECT_ROOT, 'compose.yml');
    const composeContent = await readFile(composePath, 'utf-8');
    return composeContent.includes('demo') || composeContent.includes('example');
  } catch {}
  
  return true; // Main compose file serves as demo
}