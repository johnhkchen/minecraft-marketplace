#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * Foundation-first approach: automated schema management
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { Client } from "pg";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  filename: string;
  sql: string;
  version: number;
}

interface MigrationRecord {
  version: number;
  filename: string;
  applied_at: Date;
}

export class DatabaseMigrator {
  private client: Client;
  private schemaDir: string;

  constructor() {
    this.client = new Client({
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB || "minecraft_marketplace",
      user: process.env.POSTGRES_USER || "marketplace_user",
      password: process.env.POSTGRES_PASSWORD || "marketplace_pass",
    });
    
    this.schemaDir = join(__dirname, "schema");
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log("Connected to PostgreSQL database");
  }

  async disconnect(): Promise<void> {
    await this.client.end();
    console.log("Disconnected from PostgreSQL database");
  }

  async initMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    
    await this.client.query(sql);
    console.log("Migrations table initialized");
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.client.query(
      "SELECT version, filename, applied_at FROM migrations ORDER BY version"
    );
    
    return result.rows;
  }

  async loadMigrations(): Promise<Migration[]> {
    const files = await readdir(this.schemaDir);
    const sqlFiles = files
      .filter(file => file.endsWith(".sql"))
      .sort();

    const migrations: Migration[] = [];
    
    for (const filename of sqlFiles) {
      const version = this.extractVersionFromFilename(filename);
      if (version === null) {
        console.warn(`Skipping file with invalid version format: ${filename}`);
        continue;
      }

      const sql = await readFile(join(this.schemaDir, filename), "utf-8");
      migrations.push({ filename, sql, version });
    }

    return migrations.sort((a, b) => a.version - b.version);
  }

  private extractVersionFromFilename(filename: string): number | null {
    const match = filename.match(/^(\d+)_/);
    return match ? parseInt(match[1]) : null;
  }

  async applyMigration(migration: Migration): Promise<void> {
    console.log(`Applying migration ${migration.filename}...`);
    
    try {
      await this.client.query("BEGIN");
      
      // Apply the migration
      await this.client.query(migration.sql);
      
      // Record the migration
      await this.client.query(
        "INSERT INTO migrations (version, filename) VALUES ($1, $2)",
        [migration.version, migration.filename]
      );
      
      await this.client.query("COMMIT");
      console.log(`✓ Applied migration ${migration.filename}`);
    } catch (error) {
      await this.client.query("ROLLBACK");
      console.error(`✗ Failed to apply migration ${migration.filename}:`, error);
      throw error;
    }
  }

  async migrate(): Promise<void> {
    await this.connect();
    
    try {
      await this.initMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      
      const availableMigrations = await this.loadMigrations();
      const pendingMigrations = availableMigrations.filter(
        m => !appliedVersions.has(m.version)
      );

      if (pendingMigrations.length === 0) {
        console.log("No pending migrations");
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      console.log("All migrations applied successfully");
    } finally {
      await this.disconnect();
    }
  }

  async status(): Promise<void> {
    await this.connect();
    
    try {
      await this.initMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.loadMigrations();
      
      console.log("\nMigration Status:");
      console.log("=================");
      
      if (appliedMigrations.length === 0) {
        console.log("No migrations applied yet");
      } else {
        console.log("\nApplied migrations:");
        for (const migration of appliedMigrations) {
          console.log(`✓ ${migration.filename} (${migration.applied_at.toISOString()})`);
        }
      }
      
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = availableMigrations.filter(
        m => !appliedVersions.has(m.version)
      );
      
      if (pendingMigrations.length > 0) {
        console.log("\nPending migrations:");
        for (const migration of pendingMigrations) {
          console.log(`- ${migration.filename}`);
        }
      }
      
      console.log(`\nTotal: ${appliedMigrations.length} applied, ${pendingMigrations.length} pending`);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2] || "migrate";
  
  switch (command) {
    case "migrate":
      migrator.migrate().catch(error => {
        console.error("Migration failed:", error);
        process.exit(1);
      });
      break;
      
    case "status":
      migrator.status().catch(error => {
        console.error("Status check failed:", error);
        process.exit(1);
      });
      break;
      
    default:
      console.log("Usage: tsx migrate.ts [migrate|status]");
      process.exit(1);
  }
}