/**
 * Unit Test Setup - Fast, Isolated Testing
 * 
 * Uses MSW to mock API calls instead of real infrastructure.
 * Unit tests should run in <1s total, not 20s with infrastructure.
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { postgrestHandlers } from '../mocks/postgrest-handlers';

// Setup MSW server for API mocking
const server = setupServer(...postgrestHandlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});