# Minecraft Marketplace Development Environment
# Full service orchestration with process management
{ pkgs, ... }:

{
  # Languages and tools
  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs_22;
      npm.enable = true;
    };
    typescript.enable = true;
  };

  # Services orchestrated by Nix
  services = {
    # PostgreSQL database
    postgres = {
      enable = true;
      package = pkgs.postgresql_17;
      port = 7414;
      settings = {
        log_connections = true;
        log_statement = "all";
        logging_collector = true;
        log_disconnections = true;
        log_destination = "stderr";
      };
      initialDatabases = [{
        name = "minecraft_marketplace_dev";
      }];
      initialScript = ''
        CREATE USER dev_user WITH PASSWORD 'dev_password_2024';
        GRANT ALL PRIVILEGES ON DATABASE minecraft_marketplace_dev TO dev_user;
        ALTER USER dev_user CREATEDB;
      '';
    };

    # Redis/Valkey cache
    redis = {
      enable = true;
      port = 7415;
    };
  };

  # Development processes
  processes = {
    # Infrastructure process - PostgREST API
    postgrest = {
      exec = "${pkgs.postgrest}/bin/postgrest";
      process-compose = {
        environment = {
          PGRST_DB_URI = "postgres://dev_user:dev_password_2024@localhost:7414/minecraft_marketplace_dev";
          PGRST_DB_SCHEMAS = "public";
          PGRST_DB_ANON_ROLE = "anon";
          PGRST_JWT_SECRET = "dev_jwt_secret_2024";
          PGRST_SERVER_PORT = "7413";
        };
        depends_on = {
          postgres = {
            condition = "process_healthy";
          };
        };
      };
    };

    # Frontend development server
    frontend = {
      exec = "npm run dev --workspace=frontend";
      process-compose = {
        working_dir = ".";
        environment = {
          NODE_ENV = "development";
          ASTRO_TELEMETRY_DISABLED = "1";
          PORT = "7411";
        };
        depends_on = {
          postgres = {
            condition = "process_healthy";
          };
        };
      };
    };

    # Backend development server  
    backend = {
      exec = "npm run dev --workspace=backend";
      process-compose = {
        working_dir = ".";
        environment = {
          NODE_ENV = "development";
          PORT = "7412";
          CORS_ORIGIN = "http://localhost:7411";
          DATABASE_URL = "postgresql://dev_user:dev_password_2024@localhost:7414/minecraft_marketplace_dev";
          REDIS_URL = "redis://localhost:7415";
          JWT_SECRET = "dev_jwt_secret_2024";
        };
        depends_on = {
          postgres = {
            condition = "process_healthy";
          };
          redis = {
            condition = "process_healthy";
          };
        };
      };
    };
  };

  # Environment variables
  env = {
    NODE_ENV = "development";
    POSTGRES_DB = "minecraft_marketplace_dev";
    POSTGRES_USER = "dev_user";
    POSTGRES_PASSWORD = "dev_password_2024";
    DATABASE_URL = "postgresql://dev_user:dev_password_2024@localhost:7414/minecraft_marketplace_dev";
    REDIS_URL = "redis://localhost:7415";
    
    # Service ports
    FRONTEND_PORT = "7411";
    BACKEND_PORT = "7412";
    POSTGREST_PORT = "7413";
    POSTGRES_PORT = "7414";
    REDIS_PORT = "7415";
    
    # Development configuration
    ASTRO_TELEMETRY_DISABLED = "1";
    JWT_SECRET = "dev_jwt_secret_2024";
    CORS_ORIGIN = "http://localhost:7411";
  };

  # Development scripts
  scripts = {
    # Start all services
    up = {
      exec = ''
        echo "🚀 Starting Minecraft Marketplace..."
        echo "Services will be available at:"
        echo "  Frontend:     http://localhost:7411"
        echo "  Backend:      http://localhost:7412"  
        echo "  Database API: http://localhost:7413"
        echo "  PostgreSQL:   postgresql://dev_user:dev_password_2024@localhost:7414/minecraft_marketplace_dev"
        echo "  Redis:        redis://localhost:7415"
        echo ""
        process-compose up
      '';
    };

    # Health check all services
    health = {
      exec = ''
        echo "🏥 Checking service health..."
        echo ""
        
        # Check PostgreSQL
        if pg_isready -h localhost -p 7414 -U dev_user >/dev/null 2>&1; then
          echo "✅ PostgreSQL: Ready"
        else
          echo "❌ PostgreSQL: Not ready"
        fi
        
        # Check Redis
        if redis-cli -p 7415 ping >/dev/null 2>&1; then
          echo "✅ Redis: Ready"
        else
          echo "❌ Redis: Not ready"
        fi
        
        # Check PostgREST
        if curl -f http://localhost:7413/ >/dev/null 2>&1; then
          echo "✅ PostgREST: Ready"
        else
          echo "❌ PostgREST: Not ready"
        fi
        
        # Check Frontend
        if curl -f http://localhost:7411/ >/dev/null 2>&1; then
          echo "✅ Frontend: Ready"
        else
          echo "❌ Frontend: Not ready"
        fi
        
        # Check Backend
        if curl -f http://localhost:7412/health >/dev/null 2>&1; then
          echo "✅ Backend: Ready"
        else
          echo "❌ Backend: Not ready"
        fi
        
        echo ""
        echo "🌐 Access the marketplace at: http://localhost:7411"
      '';
    };

    # Run tests
    test = {
      exec = "npm run test:fast";
    };

    # Stop all services
    down = {
      exec = "process-compose down";
    };
  };

  # Shell hook
  enterShell = ''
    echo "🏗️ Minecraft Marketplace Development Environment (Nix)"
    echo "====================================================="
    echo ""
    echo "🛠️ Commands:"
    echo "  up       - Start all services with process orchestration"
    echo "  health   - Check service health"
    echo "  test     - Run fast tests"
    echo "  down     - Stop all services"
    echo ""
    echo "🚀 Quick start: Run 'up' to start developing!"
    echo ""
  '';
}