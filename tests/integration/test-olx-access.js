/**
 * Phase 6: OLX.pl (Poland) accessibility test
 * Testing Poland's largest classifieds marketplace
 * https://www.olx.pl
 */

import { getBrowser, fetchWithBrowser, closeBrowser } from './lib/browser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_URLS = [
  // Basic search patterns
  { 
    url: 'https://www.olx.pl/oferty/q-iphone/',
    description: 'Basic query (iphone)' 
  },
  { 
    url: 'https://www.olx.pl/elektronika/q-iphone/',
    description: 'Category + query (electronics/iphone)' 
  },
  { 
    url: 'https://www.olx.pl/warszawa/q-iphone/',
    description: 'Location + query (Warsaw/iphone)' 
  },
  
  // Polish language keywords
  { 
    url: 'https://www.olx.pl/oferty/q-telefon/',
    description: 'Polish keyword (telefon = phone)' 
  },
  { 
    url: 'https://www.olx.pl/oferty/q-laptop/',
    description: 'Search: laptop' 
  },
  { 
    url: 'https://www.olx.pl/elektronika/telefony-akcesoria/',
    description: 'Electronics category (phones and accessories)' 
  }
];

async function testOlxAccess() {
  console.log('🇵🇱 Testing OLX.pl accessibility (Poland\'s largest classifieds)...\n');
  
  const results = [];
  
  for (const { url, description } of TEST_URLS) {
    console.log(`Testing: ${description}`);
    console.log(`URL: ${url}`);
    
    try {
      const html = await fetchWithBrowser(url, { timeout: 15000 });
      
      // Check for Turnstile (Cloudflare challenge)
      const isTurnstile = html.includes('Checking your browser') || 
                         html.includes('cf-browser-verification') ||
                         html.includes('turnstile');
      
      // Check for React content
      const hasReactContent = html.includes('"OLX') || 
                             html.includes('apollo.olxcdn.com') ||
                             html.includes('__APOLLO_STATE__');
      
      // Check for listing indicators
      const hasListings = html.includes('data-cy="l-card"') ||
                         html.includes('listing-grid') ||
                         html.includes('"ads":') ||
                         html.includes('ad-card');
      
      // Count occurrences of price indicators
      const priceMatches = (html.match(/zł/g) || []).length; // Polish zloty symbol
      const plnMatches = (html.match(/PLN/g) || []).length;
      const totalPriceIndicators = priceMatches + plnMatches;
      
      const result = {
        url,
        description,
        success: !isTurnstile && html.length > 50000,
        turnstile: isTurnstile,
        reactContent: hasReactContent,
        hasListings: hasListings,
        priceIndicators: totalPriceIndicators,
        htmlSize: html.length
      };
      
      results.push(result);
      
      console.log(`  ✓ HTML received: ${(html.length / 1024).toFixed(0)} KB`);
      console.log(`  ${isTurnstile ? '❌ TURNSTILE DETECTED' : '✓ No Turnstile'}`);
      console.log(`  ${hasReactContent ? '✓ React content found' : '⚠ No React content'}`);
      console.log(`  ${hasListings ? '✓ Listings detected' : '⚠ No listings found'}`);
      console.log(`  Price indicators (zł/PLN): ${totalPriceIndicators}`);
      console.log('');
      
      // Save first successful HTML for analysis
      if (!isTurnstile && result.success && results.filter(r => r.success).length === 1) {
        const samplePath = path.join(__dirname, 'olx-search-sample.html');
        fs.writeFileSync(samplePath, html, 'utf8');
        console.log(`  📄 Saved HTML sample to: olx-search-sample.html\n`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      results.push({
        url,
        description,
        success: false,
        error: error.message
      });
    }
    
    // Brief delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OLX.PL TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const turnstileBlocked = results.filter(r => r.turnstile);
  const failed = results.filter(r => r.error);
  
  console.log(`\nTotal tests: ${results.length}`);
  console.log(`✓ Accessible: ${successful.length}`);
  console.log(`❌ Turnstile blocked: ${turnstileBlocked.length}`);
  console.log(`⚠ Failed (other): ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ OLX.PL IS ACCESSIBLE!');
    console.log('\nAccessible URLs:');
    successful.forEach(r => {
      console.log(`  • ${r.description}`);
      console.log(`    Listings: ${r.hasListings ? 'YES' : 'NO'} | Prices: ${r.priceIndicators} | Size: ${(r.htmlSize / 1024).toFixed(0)}KB`);
    });
    
    console.log('\n📝 Next steps:');
    console.log('  1. Review olx-search-sample.html for listing structure');
    console.log('  2. Identify listing container selectors');
    console.log('  3. Extract price, title, image patterns');
    console.log('  4. Create olx-findings.md documentation');
    console.log('  5. Implement lib/adapters/olx.js adapter');
  } else if (turnstileBlocked.length > 0) {
    console.log('\n❌ OLX.PL IS BLOCKED BY TURNSTILE');
    console.log('   Poland\'s largest marketplace is not accessible');
  } else {
    console.log('\n⚠ OLX.PL TESTS INCONCLUSIVE');
    console.log('   Review errors above for details');
  }
  
  await closeBrowser();
  return results;
}

// Run test
testOlxAccess()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
