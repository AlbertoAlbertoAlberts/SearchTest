import { getBrowser, closeBrowser } from './lib/browser.js';
import fs from 'fs';

/**
 * Phase 4: Test Tori.fi (Finland) accessibility
 * Testing multiple URL patterns to find working search endpoint
 */

const tests = [
  {
    name: 'Homepage',
    url: 'https://www.tori.fi/',
    skip: true // Already confirmed with curl
  },
  {
    name: 'Search with q parameter',
    url: 'https://www.tori.fi/koko_suomi?q=iphone',
    saveHtml: true
  },
  {
    name: 'Search with category path',
    url: 'https://www.tori.fi/uusimaa/elektroniikka?q=iphone',
    testAlternative: true
  },
  {
    name: 'Search without region (direct)',
    url: 'https://www.tori.fi?q=iphone',
    testAlternative: true
  },
  {
    name: 'Finnish term: matkapuhelin (mobile phone)',
    url: 'https://www.tori.fi/koko_suomi?q=matkapuhelin',
    testKeyword: true
  },
  {
    name: 'Finnish term: puhelin (phone)',
    url: 'https://www.tori.fi/koko_suomi?q=puhelin',
    testKeyword: true
  }
];

async function testUrl(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${test.name}`);
  console.log(`URL: ${test.url}`);
  console.log('='.repeat(60));

  if (test.skip) {
    console.log('⏭️  Skipped (already confirmed with curl)');
    return null;
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate with timeout
    const response = await page.goto(test.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    const status = response.status();
    console.log(`Status: ${status}`);
    
    if (status !== 200) {
      console.log(`❌ Failed with status ${status}`);
      await page.close();
      return { success: false, status };
    }
    
    // Get HTML content
    const html = await page.content();
    const htmlSize = Buffer.byteLength(html, 'utf8');
    console.log(`HTML size: ${htmlSize} bytes`);
    
    // Check for common indicators
    const hasListings = 
      html.includes('item-card') ||
      html.includes('ad-item') ||
      html.includes('listing') ||
      html.includes('data-testid') ||
      html.includes('EUR') ||
      html.includes('hinta');
    
    const hasCloudflare = html.includes('Cloudflare') || html.includes('cf-');
    const hasTurnstile = html.includes('turnstile') || html.includes('cf-turnstile');
    
    // Look for Finnish price indicators and common electronics terms
    const pricePatterns = [
      (html.match(/\d+\s*€/g) || []).length,
      (html.match(/\d+\s*EUR/g) || []).length,
      (html.match(/hinta/gi) || []).length
    ];
    const totalPriceMatches = pricePatterns.reduce((a, b) => a + b, 0);
    
    console.log(`- Has listings: ${hasListings ? '✅' : '❌'}`);
    console.log(`- Cloudflare challenge: ${hasCloudflare ? '⚠️ YES' : '✅ NO'}`);
    console.log(`- Turnstile: ${hasTurnstile ? '❌ YES' : '✅ NO'}`);
    console.log(`- Price indicators found: ${totalPriceMatches}`);
    
    // Check for specific Finnish patterns
    if (test.testKeyword) {
      const keywordMatches = (html.match(new RegExp(test.url.split('q=')[1], 'gi')) || []).length;
      console.log(`- Keyword matches: ${keywordMatches}`);
    }
    
    // Save HTML sample if requested
    if (test.saveHtml && hasListings) {
      const filename = 'tori-search-sample.html';
      fs.writeFileSync(filename, html, 'utf8');
      console.log(`✅ Sample HTML saved to ${filename}`);
    }
    
    await page.close();
    
    return {
      success: status === 200,
      status,
      htmlSize,
      hasListings,
      hasCloudflare,
      hasTurnstile,
      priceCount: totalPriceMatches
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🇫🇮 Phase 4: Testing Tori.fi (Finland) Accessibility');
  console.log('Testing multiple URL patterns...\n');
  
  const results = [];
  
  for (const test of tests) {
    const result = await testUrl(test);
    if (result) {
      results.push({ name: test.name, ...result });
    }
    
    // Small delay between tests
    if (!test.skip) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success && r.hasListings);
  const turnstileBlocked = results.filter(r => r.hasTurnstile);
  
  console.log(`\n✅ Working endpoints: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\nWorking URLs:');
    successful.forEach(r => {
      console.log(`  - ${r.name} (${r.priceCount} prices found)`);
    });
  }
  
  if (turnstileBlocked.length > 0) {
    console.log('\n❌ Turnstile blocked:');
    turnstileBlocked.forEach(r => console.log(`  - ${r.name}`));
  }
  
  // Final verdict
  console.log('\n' + '='.repeat(60));
  if (successful.length > 0 && turnstileBlocked.length === 0) {
    console.log('✅ TORI.FI IS ACCESSIBLE');
    console.log('Proceed with adapter implementation');
  } else if (turnstileBlocked.length > 0) {
    console.log('❌ TORI.FI HAS TURNSTILE');
    console.log('Cannot bypass - mark as blocked');
  } else {
    console.log('⚠️  TORI.FI ACCESSIBLE BUT UNCLEAR');
    console.log('Further investigation needed');
  }
  console.log('='.repeat(60));
  
  await closeBrowser();
}

runTests().catch(console.error);
