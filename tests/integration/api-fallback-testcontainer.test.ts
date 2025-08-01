/**
 * Testcontainer API Fallback Detection
 * 
 * PURPOSE: Catch API fallback bugs using real infrastructure without browser dependency
 * APPROACH: Direct HTTP calls to running services, validate data consistency
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestcontainers } from '../utils/testcontainers-setup.js';

describe('API Fallback Detection (Testcontainers)', () => {
  let testStack: any;
  let testUrls: any;

  beforeAll(async () => {
    // Start isolated test infrastructure
    testStack = await setupTestcontainers();
    testUrls = testStack.urls;
    console.log('🐳 Testcontainer stack ready:', testUrls);
  }, 30000);

  afterAll(async () => {
    if (testStack && testStack.cleanup) {
      await testStack.cleanup();
      console.log('🐳 Testcontainer stack cleaned up');
    }
  });

  it('should detect when homepage API returns synthetic data instead of real data', async () => {
    // Direct HTTP call to the homepage endpoint
    const response = await fetch(`${testUrls.nginx}/`);
    expect(response.ok).toBe(true);
    
    const htmlContent = await response.text();
    
    // Extract displayed items from HTML
    const itemNameRegex = /class="item-name"[^>]*>([^<]+)</g;
    const displayedItems = [];
    let match;
    while ((match = itemNameRegex.exec(htmlContent)) !== null) {
      displayedItems.push(match[1].trim());
    }
    
    // Extract market statistics from HTML
    const marketStatsRegex = /(\d+)\s+items\s+for\s+sale\s+from\s+(\d+)\s+shops/;
    const statsMatch = htmlContent.match(marketStatsRegex);
    const reportedItems = statsMatch ? parseInt(statsMatch[1]) : 0;
    const reportedShops = statsMatch ? parseInt(statsMatch[2]) : 0;
    
    console.log('🔍 Testcontainer HTML Analysis:');
    console.log(`  Displayed items: ${displayedItems}`);
    console.log(`  Reported stats: ${reportedItems} items from ${reportedShops} shops`);
    
    // DETECTION 1: Synthetic data signatures
    const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
    const realItems = ['Oak Wood', 'Stone Bricks', 'Glass', 'Golden Apple'];
    
    const syntheticCount = displayedItems.filter(item => syntheticItems.includes(item)).length;
    const realCount = displayedItems.filter(item => realItems.includes(item)).length;
    
    if (syntheticCount > 0 && realCount === 0) {
      throw new Error(`❌ SYNTHETIC DATA DETECTED: Found ${syntheticCount} synthetic items without real data: ${displayedItems.join(', ')}`);
    }
    
    // DETECTION 2: Statistics vs display mismatch
    if (reportedItems > 15 && displayedItems.length < 8 && syntheticCount === displayedItems.length) {
      throw new Error(`❌ STATS MISMATCH: Reports ${reportedItems} items but displays ${displayedItems.length} synthetic items`);
    }
    
    console.log('✅ Testcontainer validation passed - no synthetic data fallback detected');
  });

  it('should validate API endpoints are responding with real data', async () => {
    // Direct API calls to validate endpoint responses
    const apiEndpoints = [
      { 
        path: '/api/data/public_items?limit=5', 
        purpose: 'Main items endpoint',
        expectedFields: ['id', 'name', 'price_diamonds', 'owner_shop_name']
      },
      { 
        path: '/api/data/public_items?select=id', 
        purpose: 'Count endpoint',
        expectedFields: ['id']
      },
      { 
        path: '/api/data/public_items?select=owner_shop_name', 
        purpose: 'Shops endpoint',
        expectedFields: ['owner_shop_name']
      }
    ];

    const apiResults = {};
    
    for (const endpoint of apiEndpoints) {
      console.log(`🔌 Testing ${endpoint.purpose}: ${endpoint.path}`);
      
      const response = await fetch(`${testUrls.postgrest}${endpoint.path}`);
      
      if (!response.ok) {
        throw new Error(`❌ API ENDPOINT FAILED: ${endpoint.path} returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error(`❌ API RESPONSE FORMAT: Expected array, got ${typeof data}`);
      }
      
      // Validate expected fields
      if (data.length > 0) {
        const firstItem = data[0];
        const missingFields = endpoint.expectedFields.filter(field => !(field in firstItem));
        
        if (missingFields.length > 0) {
          throw new Error(`❌ API RESPONSE FIELDS: Missing fields ${missingFields.join(', ')} in ${endpoint.path}`);
        }
      }
      
      apiResults[endpoint.purpose] = {
        count: data.length,
        sampleData: data.slice(0, 2)
      };
      
      console.log(`  ✅ ${endpoint.purpose}: ${data.length} items`);
    }
    
    // Cross-validate API consistency
    const mainItems = apiResults['Main items endpoint'];
    const countItems = apiResults['Count endpoint'];
    
    if (mainItems.count > 0 && countItems.count === 0) {
      throw new Error(`❌ API INCONSISTENCY: Main endpoint has ${mainItems.count} items but count endpoint has 0`);
    }
    
    // DETECTION: Check for realistic data patterns
    if (mainItems.sampleData.length > 0) {
      const sampleItem = mainItems.sampleData[0];
      
      // Check for synthetic data patterns in API responses
      const syntheticNames = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
      const syntheticShops = ['Test Shop', 'Demo Store', 'Sample Vendor'];
      
      if (syntheticNames.includes(sampleItem.name)) {
        throw new Error(`❌ API SYNTHETIC DATA: API returning synthetic item name: ${sampleItem.name}`);
      }
      
      if (syntheticShops.includes(sampleItem.owner_shop_name)) {
        throw new Error(`❌ API SYNTHETIC SHOP: API returning synthetic shop name: ${sampleItem.owner_shop_name}`);
      }
      
      // Check for unrealistic prices
      if (sampleItem.price_diamonds > 500) {
        throw new Error(`❌ API UNREALISTIC PRICE: Price ${sampleItem.price_diamonds} diamonds is unrealistic`);
      }
    }
    
    console.log('✅ All API endpoints returning realistic data');
  });

  it('should detect when PostgREST is serving fallback/empty data', async () => {
    // Test PostgREST directly to ensure it's serving real data
    const postgrestTests = [
      { 
        query: 'users?limit=1', 
        description: 'User data availability' 
      },
      { 
        query: 'items?limit=3', 
        description: 'Item data availability' 
      },
      { 
        query: 'prices?limit=2', 
        description: 'Price data availability' 
      }
    ];

    const postgrestResults = {};
    
    for (const test of postgrestTests) {
      console.log(`🗄️ Testing ${test.description}: ${test.query}`);
      
      const response = await fetch(`${testUrls.postgrest}/${test.query}`);
      
      if (!response.ok) {
        console.warn(`⚠️ ${test.description} endpoint not available (${response.status})`);
        continue;
      }
      
      const data = await response.json();
      postgrestResults[test.description] = data;
      
      console.log(`  📊 ${test.description}: ${Array.isArray(data) ? data.length : 'N/A'} records`);
    }
    
    // DETECTION: If PostgREST is working but returning empty data, something's wrong
    const availableEndpoints = Object.keys(postgrestResults);
    const emptyEndpoints = availableEndpoints.filter(
      endpoint => Array.isArray(postgrestResults[endpoint]) && postgrestResults[endpoint].length === 0
    );
    
    if (availableEndpoints.length > 0 && emptyEndpoints.length === availableEndpoints.length) {
      throw new Error(`❌ POSTGREST EMPTY DATA: All ${availableEndpoints.length} endpoints return empty data - database likely empty`);
    }
    
    // DETECTION: Check for database schema issues
    if (availableEndpoints.length === 0) {
      throw new Error(`❌ POSTGREST UNAVAILABLE: No PostgREST endpoints responding - service likely down`);
    }
    
    console.log('✅ PostgREST serving data correctly');
  });

  it('should detect when nginx routing causes API failures', async () => {
    // Test nginx routing to API endpoints
    const nginxRoutingTests = [
      { path: '/api/data/public_items?limit=1', expectedStatus: 200 },
      { path: '/api/data/users?limit=1', expectedStatus: [200, 404] }, // May not exist
      { path: '/api/nonexistent', expectedStatus: 404 }
    ];

    const routingResults = [];
    
    for (const test of nginxRoutingTests) {
      console.log(`🌐 Testing nginx routing: ${test.path}`);
      
      const response = await fetch(`${testUrls.nginx}${test.path}`);
      
      const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
      const statusOk = expectedStatuses.includes(response.status);
      
      routingResults.push({
        path: test.path,
        status: response.status,
        expected: test.expectedStatus,
        ok: statusOk
      });
      
      if (!statusOk) {
        throw new Error(`❌ NGINX ROUTING FAILED: ${test.path} returned ${response.status}, expected ${test.expectedStatus}`);
      }
      
      console.log(`  ✅ ${test.path}: ${response.status}`);
    }
    
    // DETECTION: If API routes are not working, frontend will fall back to synthetic data
    const apiRouteFailed = routingResults.find(r => r.path.includes('/api/data/') && !r.ok);
    
    if (apiRouteFailed) {
      throw new Error(`❌ API ROUTE FAILURE: ${apiRouteFailed.path} not routing correctly - will cause synthetic data fallback`);
    }
    
    console.log('✅ Nginx routing working correctly');
  });

  it('should validate complete data flow from database to frontend', async () => {
    console.log('🔄 Testing complete data flow...');
    
    // Step 1: Check PostgreSQL has data
    const pgResponse = await fetch(`${testUrls.postgrest}/public_items?limit=3`);
    const pgData = await pgResponse.json();
    
    console.log(`  📚 PostgreSQL: ${pgData.length} items available`);
    
    // Step 2: Check PostgREST transforms data correctly
    const postgrestResponse = await fetch(`${testUrls.postgrest}/public_items?select=name,price_diamonds,owner_shop_name&limit=2`);
    const postgrestData = await postgrestResponse.json();
    
    console.log(`  🔄 PostgREST: ${postgrestData.length} items with correct fields`);
    
    // Step 3: Check nginx serves the data
    const nginxResponse = await fetch(`${testUrls.nginx}/api/data/public_items?limit=2`);
    const nginxData = await nginxResponse.json();
    
    console.log(`  🌐 Nginx: ${nginxData.length} items routed correctly`);
    
    // Step 4: Check frontend receives and displays the data
    const frontendResponse = await fetch(`${testUrls.nginx}/`);
    const frontendHtml = await frontendResponse.text();
    
    // Extract item names from frontend HTML
    const itemNameRegex = /class="item-name"[^>]*>([^<]+)</g;
    const frontendItems = [];
    let match;
    while ((match = itemNameRegex.exec(frontendHtml)) !== null) {
      frontendItems.push(match[1].trim());
    }
    
    console.log(`  🖥️ Frontend: ${frontendItems.length} items displayed`);
    console.log(`  📝 Displayed items: ${frontendItems}`);
    
    // DETECTION: Data flow validation
    if (pgData.length > 0 && postgrestData.length === 0) {
      throw new Error(`❌ POSTGREST FAILURE: PostgreSQL has ${pgData.length} items but PostgREST returns 0`);
    }
    
    if (postgrestData.length > 0 && nginxData.length === 0) {
      throw new Error(`❌ NGINX FAILURE: PostgREST has ${postgrestData.length} items but nginx returns 0`);
    }
    
    if (nginxData.length > 0 && frontendItems.length === 0) {
      throw new Error(`❌ FRONTEND FAILURE: API has ${nginxData.length} items but frontend displays 0`);
    }
    
    // DETECTION: Data consistency validation
    if (nginxData.length > 0 && frontendItems.length > 0) {
      const apiItemNames = nginxData.map(item => item.name);
      const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
      
      const frontendHasSynthetic = frontendItems.some(item => syntheticItems.includes(item));
      const apiHasSynthetic = apiItemNames.some(item => syntheticItems.includes(item));
      
      if (frontendHasSynthetic && !apiHasSynthetic) {
        throw new Error(`❌ DATA FLOW BREAK: API has real data but frontend shows synthetic: API[${apiItemNames}] vs Frontend[${frontendItems}]`);
      }
    }
    
    console.log('✅ Complete data flow validated - no synthetic data fallback');
  });
});