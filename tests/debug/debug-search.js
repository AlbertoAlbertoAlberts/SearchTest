/**
 * Debug script to see what URLs are being extracted
 */

import { extractPricesOnly } from './lib/adapters/ss.js';

async function debugSearch() {
  const query = 'airpods';
  const maxResults = 30; // Just test with 30
  
  console.log('Extracting prices for:', query);
  console.log();
  
  const results = await extractPricesOnly(query, maxResults);
  
  console.log('\nFirst 10 results:');
  console.log('='.repeat(80));
  
  results.slice(0, 10).forEach((item, idx) => {
    console.log(`\n${idx + 1}. Price: ${item.priceText}`);
    console.log(`   URL: ${item.url}`);
  });
}

debugSearch().catch(console.error);
