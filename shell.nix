# shell.nix - Legacy support for non-flake Nix users
# For modern development, use: nix develop (requires flakes)
# For legacy support, use: nix-shell

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Core development tools
    nodejs_22
    nodePackages.npm
    nodePackages.pnpm
    
    # Docker for services
    docker
    docker-compose
    
    # Database tools
    postgresql_17
    redis
    
    # Development utilities
    git
    curl
    jq
    
    # Testing framework
    nodePackages.typescript
    nodePackages.vitest
    
    # Code quality
    nodePackages.eslint
    nodePackages.prettier
    
    # Development workflow
    nodePackages.nodemon
    gnumake
    just
  ];

  shellHook = ''
    echo "🚀 Minecraft Marketplace Development (Legacy Shell)"
    echo "=================================================="
    echo ""
    echo "💡 For the full development experience, use:"
    echo "   nix develop  (requires flakes enabled)"
    echo ""
    echo "📦 Node.js: $(node --version)"
    echo "🐳 Docker: $(docker --version | head -n1)"
    echo ""
    echo "🛠️ Development workflow:"
    echo "  just infra   - Start infrastructure (PostgreSQL, PostgREST, nginx)"
    echo "  just dev     - Start development servers (Astro + Hono)"
    echo "  just up      - Start everything (infra + dev)"
    echo "  just health  - Check all services"
    echo "  just clean   - Clean up containers"
    echo ""
    echo "🌐 Access points:"
    echo "  Main App:     http://localhost:7410 (nginx entry point)"
    echo "  Frontend:     http://localhost:7411 (direct Astro dev server)"
    echo "  Backend:      http://localhost:7412 (direct Hono API)"
    echo "  Database API: http://localhost:7413 (PostgREST)"
    echo ""
    
    # Set basic environment variables
    export NODE_ENV=development
    export ASTRO_TELEMETRY_DISABLED=1
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
      cp .env.example .env 2>/dev/null || true
    fi
  '';
}