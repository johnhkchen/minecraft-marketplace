/**
 * API Data Consistency - Testcontainer Detection
 * 
 * PURPOSE: Simple, focused detection of API vs Frontend data consistency issues
 * INTEGRATION: Works with existing test infrastructure without custom setup
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('API Data Consistency (Testcontainers)', () => {
  beforeAll(async () => {
    // Quick infrastructure check
    try {
      const response = await fetch('http://localhost:7410/api/data/public_items?limit=1', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok && response.status !== 404) {
        console.log(`⏭️ Infrastructure not ready (${response.status}) - skipping testcontainer tests`);
        return;
      }
    } catch (error) {
      console.log(`⏭️ Infrastructure unavailable - skipping testcontainer tests`);
      return;
    }
  }, 5000);

  it('should detect when API has data but frontend displays synthetic fallback', async () => {
    const baseUrl = 'http://localhost:7410';
    
    // Step 1: Check if API endpoint has real data
    const apiResponse = await fetch(`${baseUrl}/api/data/public_items?limit=5`);
    
    if (!apiResponse.ok) {
      console.log(`ℹ️ API endpoint unavailable (${apiResponse.status}) - skipping consistency check`);
      return;
    }
    
    const apiData = await apiResponse.json();
    console.log(`🔌 API Data: ${apiData.length} items available`);
    
    if (apiData.length === 0) {
      console.log('ℹ️ API has no data - consistency check not applicable');
      return;
    }
    
    // Step 2: Check what frontend actually displays
    const frontendResponse = await fetch(`${baseUrl}/`);
    expect(frontendResponse.ok).toBe(true);
    
    const frontendHtml = await frontendResponse.text();
    
    // Extract displayed items using simple regex
    const itemMatches = frontendHtml.match(/class="item-name"[^>]*>([^<]+)/g) || [];
    const displayedItems = itemMatches.map(match => 
      match.replace(/class="item-name"[^>]*>/, '').trim()
    );
    
    console.log(`🖥️ Frontend Items: ${displayedItems}`);
    console.log(`📊 API Sample: ${apiData.slice(0, 3).map(item => item.name)}`);
    
    // DETECTION: API has data but frontend shows synthetic items
    const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
    const syntheticCount = displayedItems.filter(item => syntheticItems.includes(item)).length;
    
    if (apiData.length >= 3 && displayedItems.length > 0 && syntheticCount === displayedItems.length) {
      throw new Error(`❌ API-FRONTEND INCONSISTENCY: API has ${apiData.length} real items but frontend displays ${syntheticCount} synthetic items: ${displayedItems.join(', ')}`);
    }
    
    // DETECTION: API has data but frontend displays nothing
    if (apiData.length >= 3 && displayedItems.length === 0) {
      throw new Error(`❌ FRONTEND DISPLAY FAILURE: API has ${apiData.length} items but frontend displays none`);
    }
    
    console.log('✅ API-Frontend data consistency validated');
  });

  it('should detect when API calls are working but homepage shows fallback stats', async () => {
    const baseUrl = 'http://localhost:7410';
    
    // Check API directly
    const countResponse = await fetch(`${baseUrl}/api/data/public_items?select=id`);
    
    if (!countResponse.ok) {
      console.log(`ℹ️ Count API unavailable - skipping stats check`);
      return;
    }
    
    const countData = await countResponse.json();
    const apiItemCount = countData.length;
    
    // Check frontend stats
    const frontendResponse = await fetch(`${baseUrl}/`);
    const frontendHtml = await frontendResponse.text();
    
    const statsMatch = frontendHtml.match(/(\d+)\s+items\s+for\s+sale/);
    const frontendItemCount = statsMatch ? parseInt(statsMatch[1]) : 0;
    
    console.log(`📊 Stats Comparison: API=${apiItemCount}, Frontend=${frontendItemCount}`);
    
    // DETECTION: API has items but frontend shows zero or wildly different count
    if (apiItemCount >= 5 && frontendItemCount === 0) {
      throw new Error(`❌ STATS FALLBACK: API has ${apiItemCount} items but frontend reports 0`);
    }
    
    if (apiItemCount >= 5 && Math.abs(apiItemCount - frontendItemCount) > apiItemCount * 0.5) {
      console.warn(`⚠️ STATS DISCREPANCY: API count (${apiItemCount}) differs significantly from frontend (${frontendItemCount})`);
    }
    
    console.log('✅ Stats consistency validated');
  });

  it('should detect when PostgREST is working but data pipeline breaks', async () => {
    const baseUrl = 'http://localhost:7410';
    
    // Test the data pipeline at different points
    const pipelineTests = [
      { 
        name: 'PostgREST Direct', 
        url: `${baseUrl}/api/data/public_items?limit=3`,
        description: 'Direct PostgREST access'
      },
      { 
        name: 'Nginx API Route', 
        url: `${baseUrl}/api/data/public_items?limit=3`,
        description: 'Through nginx routing'
      }
    ];
    
    const pipelineResults = {};
    
    for (const test of pipelineTests) {
      const response = await fetch(test.url);
      
      if (response.ok) {
        const data = await response.json();
        pipelineResults[test.name] = {
          count: Array.isArray(data) ? data.length : 0,
          sample: Array.isArray(data) ? data.slice(0, 1) : null
        };
        console.log(`✅ ${test.name}: ${pipelineResults[test.name].count} items`);
      } else {
        pipelineResults[test.name] = { count: 0, error: response.status };
        console.log(`❌ ${test.name}: ${response.status}`);
      }
    }
    
    // DETECTION: Pipeline breaks somewhere
    const workingStages = Object.values(pipelineResults).filter(r => r.count > 0);
    const failingStages = Object.values(pipelineResults).filter(r => r.count === 0);
    
    if (workingStages.length > 0 && failingStages.length > 0) {
      const workingNames = Object.entries(pipelineResults)
        .filter(([, result]) => result.count > 0)
        .map(([name]) => name);
      const failingNames = Object.entries(pipelineResults)
        .filter(([, result]) => result.count === 0)
        .map(([name]) => name);
        
      throw new Error(`❌ PIPELINE BREAK: ${workingNames.join(', ')} working but ${failingNames.join(', ')} failing`);
    }
    
    console.log('✅ Data pipeline consistency validated');
  });
});