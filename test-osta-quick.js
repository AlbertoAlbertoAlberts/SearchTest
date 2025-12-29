/**
 * Quick test script for Osta.ee adapter - Step 3 verification
 * Tests scanPrices function and helps identify correct selectors
 */

import * as ostaAdapter from './lib/adapters/osta.js';

async function testScanPrices() {
  console.log('\n=== Testing Osta.ee scanPrices ===\n');
  
  try {
    // Test 1: Basic search with small maxResults
    console.log('Test 1: Searching for "iphone" (max 10 results)...');
    const results = await ostaAdapter.scanPrices('iphone', { maxResults: 10 });
    
    console.log(`\n✓ Found ${results.length} results\n`);
    
    if (results.length === 0) {
      console.log('⚠️  No results found. This could mean:');
      console.log('   1. Cloudflare is blocking us');
      console.log('   2. The selectors need updating');
      console.log('   3. No items match the search query');
      console.log('\nCheck the Puppeteer output above for clues.');
      return;
    }
    
    // Display first 3 results
    console.log('Sample results:');
    results.slice(0, 3).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.url}`);
      console.log(`   Price: ${item.priceText} (value: ${item.priceValue})`);
      console.log(`   Image: ${item.imageUrl ? 'Yes' : 'No'}`);
      console.log(`   Source: ${item.source}`);
    });
    
    // Validate structure
    console.log('\n--- Validation ---');
    const hasUrl = results.every(r => r.url);
    const hasPrice = results.every(r => r.priceText);
    const hasPriceValue = results.every(r => typeof r.priceValue === 'number');
    const hasSource = results.every(r => r.source === 'osta');
    
    console.log(`URLs present: ${hasUrl ? '✓' : '✗'}`);
    console.log(`Prices present: ${hasPrice ? '✓' : '✗'}`);
    console.log(`Price values parsed: ${hasPriceValue ? '✓' : '✗'}`);
    console.log(`Source correct: ${hasSource ? '✓' : '✗'}`);
    
    if (hasUrl && hasPrice && hasPriceValue && hasSource) {
      console.log('\n✅ All tests passed! scanPrices is working correctly.\n');
    } else {
      console.log('\n⚠️  Some validation failed. Check the data above.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
  
  // Exit to close Puppeteer
  process.exit(0);
}

testScanPrices();
