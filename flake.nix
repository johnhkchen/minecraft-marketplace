{
  description = "Minecraft Marketplace - Discord-native community marketplace";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Node.js version for consistency across environments
        nodejs = pkgs.nodejs_22;
        
        # Development tools and dependencies
        developmentTools = with pkgs; [
          # Core development tools
          nodejs
          nodePackages.npm
          nodePackages.pnpm
          
          # Docker for containerized services
          docker
          docker-compose
          
          # Database tools
          postgresql_17
          redis
          
          # Development utilities
          git
          curl
          jq
          
          # Testing and validation
          nodePackages.typescript
          
          # AI/ML tools for BAML processing
          python311
          python311Packages.pip
          
          # Security and validation
          nodePackages.eslint
          nodePackages.prettier
          
          # Build tools
          gnumake
          gcc
          
          # Development workflow
          nodePackages.nodemon
          nodePackages.concurrently
          process-compose
          postgrest
          
          # Performance monitoring
          htop
          neofetch
        ];

        # Development environment variables
        devEnvVars = {
          NODE_ENV = "development";
          POSTGRES_DB = "minecraft_marketplace_dev";
          POSTGRES_USER = "dev_user";
          POSTGRES_PASSWORD = "dev_password_nix_2024";
          JWT_SECRET = "dev_jwt_secret_for_nix_development";
          DISCORD_CLIENT_ID = "your_discord_client_id_here";
          DISCORD_CLIENT_SECRET = "your_discord_client_secret_here";
          REDIS_URL = "redis://localhost:6379";
          DATABASE_URL = "postgresql://dev_user:dev_password_nix_2024@localhost:5432/minecraft_marketplace_dev";
          VITE_API_BASE_URL = "http://localhost:3001";
          ASTRO_TELEMETRY_DISABLED = "1";
        };

      in
      {
        # Development shell for `nix develop`
        devShells.default = pkgs.mkShell {
          buildInputs = developmentTools;
          
          shellHook = ''
            echo "🏗️ Minecraft Marketplace - Nix Development Environment"
            echo "======================================================"
            echo ""
            echo "✅ Environment Ready:"
            echo "   📦 Node.js $(node --version)"
            echo "   🐳 Docker $(docker --version | head -n1 | cut -d' ' -f3)"
            echo "   🔧 Just $(just --version 2>/dev/null || echo 'command runner')"
            echo ""
            echo "🚀 Quick Start (choose one):"
            echo ""
            echo "   For Full Demo:"
            echo "   just up              # Start everything (infrastructure + dev servers)"
            echo ""
            echo "   For Development:"
            echo "   just infra           # Start infrastructure services"
            echo "   just dev             # Start development servers (in another terminal)"
            echo ""
            echo "🌐 After startup, access at:"
            echo "   Main App:       http://localhost:7410"
            echo "   Frontend Dev:   http://localhost:7411"
            echo "   Backend API:    http://localhost:7412"
            echo "   Database API:   http://localhost:7413"
            echo ""
            echo "🧪 Other commands:"
            echo "   just health          # Check all services"
            echo "   npm run test:fast    # Run 240 tests in ~80ms"
            echo "   just clean           # Stop and clean up"
            echo ""
            echo "💡 New to this project? Run 'just up' to see it working!"
            echo ""
            echo "🎯 Epic requirements: specs/MINECRAFT_MARKETPLACE_SPEC.md"
            echo ""
            
            # Set up development environment variables
            ${builtins.concatStringsSep "\n" (
              pkgs.lib.mapAttrsToList (name: value: "export ${name}='${value}'") devEnvVars
            )}
            
            # Create .env file if it doesn't exist
            if [ ! -f .env ]; then
              echo "📝 Creating .env file from template..."
              cp .env.example .env 2>/dev/null || echo "⚠️ .env.example not found"
            fi
            
            # Install npm dependencies if needed
            if [ ! -d node_modules ]; then
              echo "📦 Installing npm dependencies..."
              npm install
            fi
            
            echo "✅ Development environment ready!"
            echo ""
          '';
          
          # Environment variables for the shell
          inherit (devEnvVars) NODE_ENV POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD 
                                JWT_SECRET REDIS_URL DATABASE_URL VITE_API_BASE_URL
                                ASTRO_TELEMETRY_DISABLED;
        };

        # Formatter for `nix fmt`
        formatter = pkgs.nixpkgs-fmt;

        # Apps that can be run with `nix run`
        apps = {
          # Development server
          dev = flake-utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "minecraft-marketplace-dev" ''
              echo "🚀 Starting Minecraft Marketplace development servers..."
              ${nodejs}/bin/npm run dev
            '';
          };
          
          # Test runner
          test = flake-utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "minecraft-marketplace-test" ''
              echo "🧪 Running fast tests..."
              ${nodejs}/bin/npm run test:fast
            '';
          };
          
          # Full stack startup
          start = flake-utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "minecraft-marketplace-start" ''
              echo "🐳 Starting infrastructure services..."
              ${pkgs.docker-compose}/bin/docker-compose up -d
              echo "⏳ Waiting for services to be ready..."
              sleep 5
              echo "🚀 Starting development servers..."
              ${nodejs}/bin/npm run dev
            '';
          };
        };

        # Packages that can be built with `nix build`
        packages = {
          # Development environment as a package
          devEnv = pkgs.buildEnv {
            name = "minecraft-marketplace-dev-env";
            paths = developmentTools;
          };
        };

        # Checks for `nix flake check`
        checks = {
          # Validate the development environment
          devShell = self.devShells.${system}.default;
        };
      });
}