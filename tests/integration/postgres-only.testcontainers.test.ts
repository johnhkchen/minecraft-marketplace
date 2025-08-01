/**
 * PostgreSQL-only Integration Tests with Testcontainers
 * Simple test to verify PostgreSQL testcontainer works correctly
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

describe('PostgreSQL Testcontainer', () => {
  let postgres: StartedPostgreSqlContainer;

  beforeAll(async () => {
    console.log('🚀 Starting PostgreSQL testcontainer...');
    postgres = await new PostgreSqlContainer('postgres:17-alpine')
      .withDatabase('marketplace_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();
    
    console.log(`✅ PostgreSQL started at ${postgres.getHost()}:${postgres.getMappedPort(5432)}`);
    
    // Apply basic schema
    const { Client } = await import('pg');
    const client = new Client({
      host: postgres.getHost(),
      port: postgres.getMappedPort(5432),
      database: 'marketplace_test',
      user: 'test_user',
      password: 'test_password'
    });
    
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.end();
    
    console.log('✅ Schema applied');
  }, 60000);

  afterAll(async () => {
    if (postgres) {
      await postgres.stop();
      console.log('🧹 PostgreSQL container stopped');
    }
  });

  test('should connect to PostgreSQL and perform basic operations', async () => {
    const { Client } = await import('pg');
    const client = new Client({
      host: postgres.getHost(),
      port: postgres.getMappedPort(5432),
      database: 'marketplace_test',
      user: 'test_user',
      password: 'test_password'
    });

    await client.connect();

    // Insert test data
    const insertResult = await client.query(
      "INSERT INTO test_items (name) VALUES ($1) RETURNING id, name",
      ['Test Item']
    );

    expect(insertResult.rows).toHaveLength(1);
    expect(insertResult.rows[0].name).toBe('Test Item');
    expect(typeof insertResult.rows[0].id).toBe('number');

    // Query test data
    const selectResult = await client.query('SELECT * FROM test_items');
    expect(selectResult.rows.length).toBeGreaterThan(0);

    await client.end();
  });

  test('should handle concurrent connections', async () => {
    const { Client } = await import('pg');
    
    const clients = await Promise.all([
      new Client({
        host: postgres.getHost(),
        port: postgres.getMappedPort(5432),
        database: 'marketplace_test',
        user: 'test_user',
        password: 'test_password'
      }),
      new Client({
        host: postgres.getHost(),
        port: postgres.getMappedPort(5432),
        database: 'marketplace_test',
        user: 'test_user',
        password: 'test_password'
      })
    ]);

    await Promise.all(clients.map(client => client.connect()));

    const queries = clients.map((client, index) => 
      client.query("INSERT INTO test_items (name) VALUES ($1) RETURNING id", [`Concurrent Item ${index + 1}`])
    );

    const results = await Promise.all(queries);
    
    results.forEach((result, index) => {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
    });

    await Promise.all(clients.map(client => client.end()));
  });
});