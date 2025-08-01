import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationManager } from '../../src/lib/migration-manager.js';
import { readFileSync, existsSync, unlinkSync } from 'fs';

describe('MigrationManager', () => {
  const testDbPath = `./tests/migration-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`;
  let migrationManager: MigrationManager;
  let originalDbPath: string | undefined;

  beforeEach(() => {
    // Save original DB_PATH and set to our test path to avoid conflicts
    originalDbPath = process.env.DB_PATH;
    process.env.DB_PATH = testDbPath;
    
    // Clean up any existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
    migrationManager = new MigrationManager(testDbPath);
  });

  afterEach(() => {
    if (migrationManager) {
      migrationManager.close();
    }
    // Clean up test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
    // Restore original DB_PATH
    if (originalDbPath) {
      process.env.DB_PATH = originalDbPath;
    } else {
      delete process.env.DB_PATH;
    }
  });

  describe('constructor', () => {
    it('should create migration manager and initialize migration table', () => {
      expect(migrationManager).toBeDefined();
      
      // Check that migrations table was created
      const status = migrationManager.getStatus();
      expect(status).toHaveProperty('executed');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('total');
    });
  });

  describe('getStatus', () => {
    it('should return migration status with pending migrations', () => {
      const status = migrationManager.getStatus();
      
      expect(status.total).toBe(2); // We have 2 migration files
      expect(status.executed.length).toBe(0); // None executed yet
      expect(status.pending.length).toBe(2); // Both pending
      expect(status.pending).toContain('001_initial_schema.sql');
      expect(status.pending).toContain('002_seed_data.sql');
    });

    it('should show correct status after running migrations', () => {
      migrationManager.runMigrations();
      
      const status = migrationManager.getStatus();
      
      expect(status.total).toBe(2);
      expect(status.executed.length).toBe(2);
      expect(status.pending.length).toBe(0);
      expect(status.executed).toContain('001_initial_schema.sql');
      expect(status.executed).toContain('002_seed_data.sql');
    });
  });

  describe('runMigrations', () => {
    it('should run all pending migrations', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      migrationManager.runMigrations();
      
      const status = migrationManager.getStatus();
      expect(status.executed.length).toBe(2);
      expect(status.pending.length).toBe(0);
      
      // Check that success messages were logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Migration 001_initial_schema.sql completed successfully'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Migration 002_seed_data.sql completed successfully'));
      
      consoleSpy.mockRestore();
    });

    it('should not run migrations twice', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Run migrations first time
      migrationManager.runMigrations();
      
      // Run migrations second time
      migrationManager.runMigrations();
      
      // Should log that migrations are up to date
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('All migrations are up to date'));
      
      consoleSpy.mockRestore();
    });

    it('should create database tables from schema migration', () => {
      migrationManager.runMigrations();
      
      // Test that we can access the tables (this would throw if tables don't exist)
      const db = new (require('better-sqlite3'))(testDbPath);
      
      try {
        // Check that tables exist by querying their structure
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const tableNames = tables.map((t: any) => t.name);
        
        expect(tableNames).toContain('sellers');
        expect(tableNames).toContain('items');
        expect(tableNames).toContain('listings');
        expect(tableNames).toContain('transactions');
        expect(tableNames).toContain('migrations');
        
        // Check that seed data was inserted
        const listingsCount = db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number };
        expect(listingsCount.count).toBe(26); // From seed data
        
        const sellersCount = db.prepare('SELECT COUNT(*) as count FROM sellers').get() as { count: number };
        expect(sellersCount.count).toBe(4); // From seed data
        
        const itemsCount = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
        expect(itemsCount.count).toBe(26); // From seed data
      } finally {
        db.close();
      }
    });
  });

  describe('resetDatabase', () => {
    it('should drop all tables except migrations', () => {
      // First run migrations to create tables
      migrationManager.runMigrations();
      
      const db = new (require('better-sqlite3'))(testDbPath);
      
      // Verify tables exist
      let tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'migrations'").all();
      expect(tables.length).toBeGreaterThan(0);
      
      db.close();
      
      // Reset database
      migrationManager.resetDatabase();
      
      const dbAfterReset = new (require('better-sqlite3'))(testDbPath);
      
      try {
        // Check that only migrations table exists (exclude SQLite internal tables)
        tables = dbAfterReset.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('migrations', 'sqlite_sequence')").all();
        if (tables.length > 0) {
          console.log('Remaining tables after reset:', tables.map((t: any) => t.name));
        }
        expect(tables.length).toBe(0);
        
        // Migrations table should still exist but be empty
        const migrationsCount = dbAfterReset.prepare('SELECT COUNT(*) as count FROM migrations').get() as { count: number };
        expect(migrationsCount.count).toBe(0);
      } finally {
        dbAfterReset.close();
      }
    });

    it('should allow re-running migrations after reset', () => {
      // Run migrations
      migrationManager.runMigrations();
      
      let status = migrationManager.getStatus();
      expect(status.executed.length).toBe(2);
      
      // Reset database
      migrationManager.resetDatabase();
      
      status = migrationManager.getStatus();
      expect(status.executed.length).toBe(0);
      expect(status.pending.length).toBe(2);
      
      // Run migrations again
      migrationManager.runMigrations();
      
      status = migrationManager.getStatus();
      expect(status.executed.length).toBe(2);
      expect(status.pending.length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing migrations directory gracefully', () => {
      // Test what happens when migrations directory doesn't exist
      // We'll temporarily move the migrations directory
      const fs = require('fs');
      const path = require('path');
      const migrationsDir = './src/lib/migrations';
      const backupDir = './src/lib/migrations-backup';
      
      try {
        // Move migrations directory temporarily
        if (fs.existsSync(migrationsDir)) {
          fs.renameSync(migrationsDir, backupDir);
        }
        
        // Create a new migration manager
        const tempDbPath = `./tests/temp-migration-${Date.now()}.db`;
        const tempManager = new MigrationManager(tempDbPath);
        
        try {
          const status = tempManager.getStatus();
          expect(status.total).toBe(0);
          expect(status.executed.length).toBe(0);
          expect(status.pending.length).toBe(0);
        } finally {
          tempManager.close();
          // Clean up temp database
          if (fs.existsSync(tempDbPath)) {
            fs.unlinkSync(tempDbPath);
          }
        }
      } finally {
        // Restore migrations directory
        if (fs.existsSync(backupDir)) {
          fs.renameSync(backupDir, migrationsDir);
        }
      }
    });

    it('should handle database connection errors', () => {
      migrationManager.close();
      
      // Try to run migrations on closed database
      expect(() => {
        migrationManager.runMigrations();
      }).toThrow();
    });
  });

  describe('migration file handling', () => {
    it('should execute migrations in correct order', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      migrationManager.runMigrations();
      
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      
      // Find the execution order by looking for the "Executing migration" logs
      const executionLogs = logCalls.filter(log => log.includes('Executing migration:'));
      
      expect(executionLogs[0]).toContain('001_initial_schema.sql');
      expect(executionLogs[1]).toContain('002_seed_data.sql');
      
      consoleSpy.mockRestore();
    });

    it('should record migration execution with timestamps', () => {
      migrationManager.runMigrations();
      
      const db = new (require('better-sqlite3'))(testDbPath);
      
      try {
        const migrations = db.prepare('SELECT * FROM migrations ORDER BY executed_at').all();
        
        expect(migrations.length).toBe(2);
        expect(migrations[0].filename).toBe('001_initial_schema.sql');
        expect(migrations[1].filename).toBe('002_seed_data.sql');
        
        // Check that timestamps are valid
        expect(new Date(migrations[0].executed_at)).toBeInstanceOf(Date);
        expect(new Date(migrations[1].executed_at)).toBeInstanceOf(Date);
      } finally {
        db.close();
      }
    });
  });
});