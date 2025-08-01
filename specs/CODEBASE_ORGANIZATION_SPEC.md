# Codebase Organization Specification

> **Purpose**: Transform messy root directory into tidy, organized structure  
> **Goal**: Reduce cognitive load and improve collaboration readiness  
> **Critical**: Must complete before project collaboration

---

## Current Problems (Root Directory Explosion)

### 🚫 Current Messy State
```
minecraft-marketplace/
├── astro.config.mjs          # Config file at root
├── vitest.config.ts          # Config file at root  
├── vitest.fast.config.ts     # Config file at root
├── vitest.unit.config.ts     # Config file at root
├── vitest.collaboration.config.ts # Config file at root
├── vitest.testcontainers.config.ts # Config file at root
├── playwright.config.ts      # Config file at root
├── tsconfig.json            # Config file at root
├── compose.yml              # Config file at root
├── compose.dev.yml          # Config file at root
├── compose.test.yml         # Config file at root
├── compose.demo.yml         # Config file at root
├── Dockerfile               # Config file at root
├── devenv.yaml              # Config file at root
├── flake.nix                # Config file at root
├── flake.lock               # Config file at root
├── shell.nix                # Config file at root
├── process-compose.yaml     # Config file at root
├── docker-entrypoint.sh     # Config file at root
├── backend/                 # Workspace directory
├── frontend/                # Workspace directory  
├── shared/                  # Workspace directory
├── src/                     # Duplicate source code
├── infrastructure/          # Mixed configs
├── database/                # Mixed configs
├── tests/                   # Test files
├── docs/                    # Documentation
├── specs/                   # Specifications
├── scripts/                 # Build scripts
├── tools/                   # Utility tools
├── data/                    # Runtime data
├── tmp/                     # Temporary files
├── coverage/                # Generated files
├── dist/                    # Generated files
├── playwright-report/       # Generated files
├── uploads/                 # Runtime files
├── public/                  # Static assets
├── node_modules/            # Dependencies
└── [30+ more files]         # Chaos continues...
```

### Problems This Creates
- **Analysis Paralysis**: "Which config file controls what?"
- **Context Switching**: Jump between 15 locations for one feature
- **Tool Confusion**: Multiple configs for same tools everywhere
- **Merge Conflicts**: Everyone touching root-level files
- **Newcomer Confusion**: "Where do I even start?"

---

## ✅ Target Tidy Structure

### Clean Root Directory
```
minecraft-marketplace/
├── .github/                 # CI/CD workflows
├── config/                  # ALL configuration files
│   ├── astro/
│   │   └── astro.config.mjs
│   ├── docker/
│   │   ├── compose.yml
│   │   ├── compose.dev.yml
│   │   ├── compose.test.yml
│   │   ├── compose.demo.yml
│   │   └── Dockerfile
│   ├── nix/
│   │   ├── devenv.yaml
│   │   ├── flake.nix
│   │   ├── flake.lock
│   │   ├── shell.nix
│   │   └── process-compose.yaml
│   ├── testing/
│   │   ├── vitest.config.ts
│   │   ├── vitest.fast.config.ts
│   │   ├── vitest.unit.config.ts
│   │   ├── vitest.collaboration.config.ts
│   │   ├── vitest.testcontainers.config.ts
│   │   └── playwright.config.ts
│   └── typescript/
│       └── tsconfig.json
├── docs/                    # Project documentation
├── workspaces/             # All code workspaces
│   ├── frontend/           # Astro + Svelte app
│   ├── backend/            # Hono API server
│   └── shared/             # Shared utilities
├── tests/                  # All test files
├── scripts/                # Build and utility scripts
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── CLAUDE.md               # AI development context
├── README.md               # Project overview
├── package.json            # Root package manager
├── package-lock.json       # Lock file
└── justfile                # Task runner
```

### Key Organizational Principles

**🗂️ Configuration Consolidation**
- All config files in `config/` directory
- Tool-specific subdirectories
- Clear hierarchy by tool type
- Single source of truth for each concern

**📁 Logical Grouping**
- Related files live together
- Clear hierarchy of importance  
- Consistent naming conventions
- Easy mental model for finding things

**🎯 Root Only for Essentials**
- Package manager files (package.json, lockfiles)
- Essential project files (README, .gitignore, CLAUDE.md)
- Task runner (justfile)
- Everything else organized into directories

---

## Detailed Reorganization Plan

### Phase 1: Create Clean Directory Structure
```bash
mkdir -p config/{astro,docker,nix,testing,typescript}
mkdir -p workspaces
mkdir -p archive/old-structure
```

### Phase 2: Move Configuration Files
```bash
# Docker configurations
mv compose*.yml config/docker/
mv Dockerfile config/docker/
mv docker-entrypoint.sh config/docker/

# Nix configurations  
mv devenv.yaml config/nix/
mv flake.* config/nix/
mv shell.nix config/nix/
mv process-compose.yaml config/nix/

# Testing configurations
mv vitest*.config.ts config/testing/
mv playwright.config.ts config/testing/

# TypeScript configuration
mv tsconfig.json config/typescript/

# Astro configuration
mv astro.config.mjs config/astro/
```

### Phase 3: Reorganize Workspaces
```bash
# Create unified workspaces directory
mv backend workspaces/
mv frontend workspaces/
mv shared workspaces/

# Remove duplicate src/ (content moved to workspaces)
rm -rf src/
```

### Phase 4: Clean Up Generated/Runtime Files
```bash
# Move runtime data to appropriate locations
mkdir -p .local/{data,tmp,uploads}
mv data/* .local/data/ 2>/dev/null || true
mv tmp/* .local/tmp/ 2>/dev/null || true
mv uploads/* .local/uploads/ 2>/dev/null || true

# Update .gitignore for new structure
echo ".local/" >> .gitignore
echo "coverage/" >> .gitignore
echo "dist/" >> .gitignore
echo "playwright-report/" >> .gitignore
```

### Phase 5: Update Configuration References
```bash
# Update justfile to reference new config locations
# Update package.json scripts to reference new paths
# Update GitHub Actions to use new structure
# Update Docker configs to use new paths
```

---

## Configuration Updates Required

### 1. Update justfile References
```bash
# OLD
docker compose -f compose.dev.yml up

# NEW  
docker compose -f config/docker/compose.dev.yml up
```

### 2. Update package.json Scripts
```json
{
  "scripts": {
    "test": "vitest --config config/testing/vitest.config.ts",
    "test:fast": "vitest --config config/testing/vitest.fast.config.ts",
    "test:e2e": "playwright test --config config/testing/playwright.config.ts",
    "build": "astro build --config config/astro/astro.config.mjs"
  }
}
```

### 3. Update Docker Compose Files
```yaml
# config/docker/compose.yml
services:
  frontend:
    build:
      context: ../../
      dockerfile: config/docker/Dockerfile
```

### 4. Update TypeScript References  
```json
// config/typescript/tsconfig.json
{
  "extends": "./base.json",
  "include": ["../../workspaces/**/*", "../../tests/**/*"]
}
```

---

## Benefits of Reorganization

### 🎯 Immediate Benefits
- **Root Directory**: 15 essential files instead of 50+
- **Clear Mental Model**: Config goes in config/, code goes in workspaces/
- **Reduced Conflicts**: Fewer people editing root-level files
- **Faster Navigation**: Know exactly where to find things

### 🚀 Collaboration Benefits
- **Newcomer Friendly**: Obvious structure from first glance
- **Tool Consistency**: All configs for each tool in one place
- **Merge Safety**: Less conflicts on shared configuration
- **Documentation**: Self-documenting directory structure

### 🔧 Maintenance Benefits
- **Configuration Management**: Easy to find and update tool configs
- **Dependency Tracking**: Clear separation of concerns
- **Build System**: Cleaner build and deployment scripts
- **IDE Support**: Better IntelliSense and tooling support

---

## Validation Criteria

### ✅ Success Metrics
- **Root File Count**: <15 files/directories at root level
- **Config Consolidation**: All tool configs in config/ subdirectories  
- **Clear Hierarchy**: Related files grouped together logically
- **Working Build**: All npm scripts and justfile commands work
- **Tool Integration**: IDEs and editors work with new structure

### 🧪 Testing Requirements
- [ ] All existing tests pass with new structure
- [ ] Docker builds work with new paths
- [ ] Development scripts work with new config locations
- [ ] Production deployment works with new structure
- [ ] IDE/editor tooling works with new layout

### 📋 Documentation Updates
- [ ] Update README.md with new structure
- [ ] Update CLAUDE.md with new file locations
- [ ] Update developer documentation
- [ ] Update deployment guides
- [ ] Update justfile help documentation

---

## Migration Strategy

### 🚨 Critical Requirements
1. **Zero Downtime**: Production deployment must continue working
2. **Git History**: Preserve file history through moves (use `git mv`)
3. **Team Coordination**: Communicate changes before implementation  
4. **Rollback Plan**: Keep old structure in archive/ until confirmed working
5. **Test Everything**: Validate all functionality after reorganization

### 📅 Implementation Steps
1. **Create New Structure**: Build new directory layout
2. **Move Files Gradually**: Use `git mv` to preserve history
3. **Update References**: Fix all config and script references
4. **Test Thoroughly**: Validate all functionality
5. **Clean Up**: Remove old structure and temporary files
6. **Document Changes**: Update all documentation

---

## Root Directory Health Check

### 🚫 Red Flags (Current State)
- ✅ Multiple configs for same tool scattered around
- ✅ 50+ files at root level creating analysis paralysis
- ✅ Mixed concerns (runtime data next to source code)
- ✅ Unclear file organization and naming
- ✅ Difficult for newcomers to navigate

### ✅ Green Flags (Target State)
- ⏳ Clear file hierarchy with related files grouped
- ⏳ Consistent naming and logical organization
- ⏳ Obvious locations for each type of file
- ⏳ Minimal root with only essential project files
- ⏳ Self-documenting directory structure

---

*This reorganization is essential for collaboration readiness and long-term maintainability.*