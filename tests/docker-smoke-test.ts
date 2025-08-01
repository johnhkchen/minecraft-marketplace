#!/usr/bin/env tsx
/**
 * Docker Smoke Test
 * Validates fresh install works correctly
 */

import { exec } from "child_process";
import { promisify } from "util";
import { waitForAllServicesHealthy, waitForCondition } from "./utils/wait-helpers.js";

const execAsync = promisify(exec);

interface HealthCheck {
  service: string;
  url: string;
  expectedStatus?: number;
}

const healthChecks: HealthCheck[] = [
  { service: "Frontend", url: "http://localhost:4321/api/health", expectedStatus: 200 },
  { service: "Backend", url: "http://localhost:3001/health", expectedStatus: 200 },
  { service: "PostgREST", url: "http://localhost:3000/", expectedStatus: 200 },
  { service: "Database", url: "", expectedStatus: undefined }, // Will use docker exec
];

// Removed arbitrary sleep function - using proper event-driven waiting instead

async function checkService(check: HealthCheck): Promise<boolean> {
  try {
    if (check.service === "Database") {
      // Special check for PostgreSQL using docker compose
      const dbUser = process.env.POSTGRES_USER || 'marketplace_user';
      const dbName = process.env.POSTGRES_DB || 'minecraft_marketplace';
      await execAsync(`docker compose -f infrastructure/docker/compose.yml exec -T db pg_isready -U ${dbUser} -d ${dbName}`);
      console.log(`✓ ${check.service} is healthy`);
      return true;
    } else {
      // HTTP health check
      const response = await fetch(check.url);
      if (response.status === (check.expectedStatus || 200)) {
        console.log(`✓ ${check.service} is healthy (${response.status})`);
        return true;
      } else {
        console.error(`✗ ${check.service} returned status ${response.status}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`✗ ${check.service} health check failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function runSmokeTest(): Promise<void> {
  console.log("🧪 Running Docker Smoke Test...\n");
  
  try {
    // Wait for all services to be healthy using proper event-driven waiting
    console.log("⏳ Waiting for services to become healthy...");
    
    // Special handling for database check using docker exec
    const dbCheck = healthChecks.find(c => c.service === "Database");
    if (dbCheck) {
      console.log("🔄 Checking database connectivity...");
      await waitForCondition(
        async () => {
          const result = await checkService(dbCheck);
          return result;
        },
        "Database failed to become healthy",
        { maxAttempts: 20, baseDelayMs: 500, timeoutMs: 60000 }
      );
    }

    // Wait for HTTP services in parallel
    const httpServices = healthChecks
      .filter(c => c.service !== "Database")
      .map(c => ({ name: c.service, url: c.url }));
    
    if (httpServices.length > 0) {
      await waitForAllServicesHealthy(httpServices, {
        maxAttempts: 30,
        baseDelayMs: 1000,
        timeoutMs: 60000
      });
    }

    console.log("\n🎉 All services are healthy!");
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 All services are healthy! Fresh install successful.");
    console.log("\nAccess points:");
    console.log("- Frontend: http://localhost:4321");
    console.log("- Backend API: http://localhost:3001");
    console.log("- Database API: http://localhost:3000");
    console.log("- API Docs: http://localhost:8080 (dev mode)");
    process.exit(0);
    
  } catch (error) {
    console.log("\n" + "=".repeat(50));
    console.log("❌ Some services failed health checks. Check Docker logs:");
    console.log("   docker compose logs");
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmokeTest().catch(error => {
    console.error("Smoke test failed:", error);
    process.exit(1);
  });
}